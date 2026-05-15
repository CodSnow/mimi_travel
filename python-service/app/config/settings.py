from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mimi Python Service"
    database_url: str = "postgresql+psycopg://postgres:postgres@postgres:54322/mimi_python"
    internal_api_token: str = "change-me"
    default_page_size: int = 20
    max_page_size: int = 50
    payment_provider: str = "local"
    alipay_app_id: str | None = None
    alipay_private_key: str | None = None
    alipay_public_key: str | None = None
    alipay_notify_url: str | None = None
    alipay_gateway_url: str = "https://openapi.alipay.com/gateway.do"
    wechat_pay_mch_id: str | None = None
    wechat_pay_app_id: str | None = None
    wechat_pay_api_v3_key: str | None = None
    wechat_pay_private_key: str | None = None
    wechat_pay_serial_no: str | None = None
    wechat_pay_notify_url: str | None = None

    model_config = SettingsConfigDict(env_prefix="MIMI_", extra="ignore")


settings = Settings()
