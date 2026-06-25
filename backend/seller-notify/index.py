import json
import os
import urllib.request
import urllib.error

ADMIN_EMAIL = "Sharifzodabobur1998@gmail.com"
FROM_EMAIL = "noreply@saburi-mol.com"


def handler(event: dict, context) -> dict:
    """Отправка уведомления администратору о новой заявке продавца."""
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Invalid JSON"})}

    first_name = body.get("firstName", "").strip()
    last_name = body.get("lastName", "").strip()
    email = body.get("email", "").strip()

    if not first_name or not last_name or not email:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Заполните все поля"}),
        }

    api_key = os.environ.get("SENDGRID_API_KEY", "")
    if not api_key:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": "Email сервис не настроен"}),
        }

    subject = f"Новая заявка продавца — {first_name} {last_name}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #7c3aed, #f97316); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Сабури мол</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0;">Новая заявка продавца</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">Имя:</td>
            <td style="padding: 8px 0; font-weight: 600;">{first_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Фамилия:</td>
            <td style="padding: 8px 0; font-weight: 600;">{last_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:{email}" style="color: #7c3aed;">{email}</a></td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 14px; background: #ede9fe; border-radius: 8px; font-size: 14px; color: #5b21b6;">
          Чтобы активировать продавца — свяжитесь с ним по email и подтвердите аккаунт вручную.
        </div>
      </div>
    </div>
    """

    payload = json.dumps({
        "personalizations": [{"to": [{"email": ADMIN_EMAIL}]}],
        "from": {"email": FROM_EMAIL, "name": "Сабури мол"},
        "subject": subject,
        "content": [{"type": "text/html", "value": html_body}],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 202):
                return {
                    "statusCode": 200,
                    "headers": cors_headers,
                    "body": json.dumps({"success": True}),
                }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": "Ошибка отправки", "detail": err_body}),
        }

    return {
        "statusCode": 500,
        "headers": cors_headers,
        "body": json.dumps({"error": "Неизвестная ошибка"}),
    }
