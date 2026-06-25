import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p47280297_saburi_mall_project_")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Авторизация продавцов: регистрация и вход."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Invalid JSON"})}

    action = body.get("action")

    if action == "register":
        first_name = body.get("firstName", "").strip()
        last_name = body.get("lastName", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not all([first_name, last_name, email, password]):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.sellers WHERE email = %s", (email,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Email уже зарегистрирован"})}

        cur.execute(
            f"INSERT INTO {SCHEMA}.sellers (first_name, last_name, email, password_hash) VALUES (%s, %s, %s, %s)",
            (first_name, last_name, email, hash_password(password)),
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True, "message": "Заявка отправлена. Ожидайте активации администратором."})}

    if action == "login":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите email и пароль"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, first_name, last_name, is_active FROM {SCHEMA}.sellers WHERE email = %s AND password_hash = %s",
            (email, hash_password(password)),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}

        seller_id, first_name, last_name, is_active = row
        if not is_active:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Аккаунт ещё не активирован. Ожидайте подтверждения администратора."})}

        token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (seller_id, token) VALUES (%s, %s)", (seller_id, token))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "success": True,
            "token": token,
            "seller": {"id": seller_id, "firstName": first_name, "lastName": last_name, "email": email},
        })}

    if action == "me":
        token = body.get("token", "")
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT s.id, s.first_name, s.last_name, s.email
                FROM {SCHEMA}.sessions ss
                JOIN {SCHEMA}.sellers s ON s.id = ss.seller_id
                WHERE ss.token = %s AND s.is_active = TRUE""",
            (token,),
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "seller": {"id": row[0], "firstName": row[1], "lastName": row[2], "email": row[3]},
        })}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}
