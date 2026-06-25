import json
import os
import hashlib
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p47280297_saburi_mall_project_")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_admin(password: str) -> bool:
    admin_pwd = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_pwd:
        return False
    return hashlib.sha256(password.encode()).hexdigest() == hashlib.sha256(admin_pwd.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Панель администратора: активация продавцов, управление товарами."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Invalid JSON"})}

    password = body.get("password", "")
    action = body.get("action", "")

    if not check_admin(password):
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён"})}

    conn = get_conn()
    cur = conn.cursor()

    # Список всех продавцов
    if action == "list_sellers":
        cur.execute(
            f"SELECT id, first_name, last_name, email, is_active, created_at FROM {SCHEMA}.sellers ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        conn.close()
        sellers = [
            {"id": r[0], "firstName": r[1], "lastName": r[2], "email": r[3],
             "isActive": r[4], "createdAt": r[5].isoformat()}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"sellers": sellers})}

    # Активировать / деактивировать продавца
    if action == "toggle_seller":
        seller_id = body.get("sellerId")
        active = body.get("active", True)
        if not seller_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "sellerId обязателен"})}
        cur.execute(f"UPDATE {SCHEMA}.sellers SET is_active = %s WHERE id = %s", (active, seller_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    # Список всех товаров
    if action == "list_products":
        cur.execute(
            f"""SELECT p.id, p.title, p.price, p.image_url, p.category, p.is_active,
                       s.first_name || ' ' || s.last_name AS seller, p.created_at
                FROM {SCHEMA}.products p
                JOIN {SCHEMA}.sellers s ON s.id = p.seller_id
                ORDER BY p.created_at DESC"""
        )
        rows = cur.fetchall()
        conn.close()
        products = [
            {"id": r[0], "title": r[1], "price": float(r[2]), "image": r[3],
             "category": r[4], "isActive": r[5], "seller": r[6], "createdAt": r[7].isoformat()}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"products": products})}

    # Скрыть / показать товар
    if action == "toggle_product":
        product_id = body.get("productId")
        active = body.get("active", True)
        if not product_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "productId обязателен"})}
        cur.execute(f"UPDATE {SCHEMA}.products SET is_active = %s WHERE id = %s", (active, product_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    # Удалить товар
    if action == "delete_product":
        product_id = body.get("productId")
        if not product_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "productId обязателен"})}
        cur.execute(f"UPDATE {SCHEMA}.products SET is_active = FALSE WHERE id = %s", (product_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    conn.close()
    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}
