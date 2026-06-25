import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p47280297_saburi_mall_project_")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_seller_by_token(cur, token: str):
    cur.execute(
        f"""SELECT s.id, s.first_name, s.last_name
            FROM {SCHEMA}.sessions ss
            JOIN {SCHEMA}.sellers s ON s.id = ss.seller_id
            WHERE ss.token = %s AND s.is_active = TRUE""",
        (token,),
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Управление товарами продавца: добавление, список, публичный каталог."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Invalid JSON"})}

    action = body.get("action")

    # Публичный каталог — без авторизации
    if action == "list_public":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT p.id, p.title, p.description, p.price, p.old_price, p.image_url,
                       p.category, p.sub_category, s.first_name || ' ' || s.last_name AS seller
                FROM {SCHEMA}.products p
                JOIN {SCHEMA}.sellers s ON s.id = p.seller_id
                WHERE p.is_active = TRUE
                ORDER BY p.created_at DESC"""
        )
        rows = cur.fetchall()
        conn.close()
        products = [
            {"id": r[0], "title": r[1], "description": r[2], "price": float(r[3]),
             "oldPrice": float(r[4]) if r[4] else None, "image": r[5],
             "category": r[6], "sub": r[7], "seller": r[8]}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"products": products})}

    # Список товаров продавца
    if action == "my_products":
        token = body.get("token", "")
        conn = get_conn()
        cur = conn.cursor()
        seller = get_seller_by_token(cur, token)
        if not seller:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        cur.execute(
            f"""SELECT id, title, price, old_price, image_url, category, sub_category, is_active, created_at
                FROM {SCHEMA}.products WHERE seller_id = %s ORDER BY created_at DESC""",
            (seller[0],),
        )
        rows = cur.fetchall()
        conn.close()
        products = [
            {"id": r[0], "title": r[1], "price": float(r[2]),
             "oldPrice": float(r[3]) if r[3] else None,
             "image": r[4], "category": r[5], "sub": r[6],
             "isActive": r[7]}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"products": products})}

    # Добавить товар
    if action == "add_product":
        token = body.get("token", "")
        conn = get_conn()
        cur = conn.cursor()
        seller = get_seller_by_token(cur, token)
        if not seller:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        title = body.get("title", "").strip()
        price_raw = body.get("price")
        category = body.get("category", "Разное").strip()
        sub_category = body.get("subCategory", "").strip() or None
        description = body.get("description", "").strip() or None
        old_price_raw = body.get("oldPrice")
        image_b64 = body.get("imageBase64", "")

        if not title or not price_raw:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите название и цену"})}

        try:
            price = float(price_raw)
            old_price = float(old_price_raw) if old_price_raw else None
        except (ValueError, TypeError):
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Некорректная цена"})}

        image_url = None
        if image_b64:
            try:
                # strip data URI prefix if present
                if "," in image_b64:
                    image_b64 = image_b64.split(",", 1)[1]
                image_data = base64.b64decode(image_b64)
                s3 = boto3.client(
                    "s3",
                    endpoint_url="https://bucket.poehali.dev",
                    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
                )
                key = f"products/{uuid.uuid4().hex}.jpg"
                s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType="image/jpeg")
                image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            except Exception:
                pass

        cur.execute(
            f"""INSERT INTO {SCHEMA}.products
                (seller_id, title, description, price, old_price, image_url, category, sub_category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (seller[0], title, description, price, old_price, image_url, category, sub_category),
        )
        product_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True, "productId": product_id})}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}
