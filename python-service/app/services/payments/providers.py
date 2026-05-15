from dataclasses import dataclass
from typing import Any, Protocol

from app.config.settings import Settings


class PaymentProviderError(RuntimeError):
    """支付 provider 层错误，保留 status_code 供服务层映射为业务异常。"""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class PaymentProvider(Protocol):
    """支付 provider 生命周期接口，屏蔽本地与真实通道的实现差异。"""

    def create_payment(self, out_trade_no: str, amount_fen: int, subject: str) -> dict[str, Any]:
        """创建支付单；参数为商户单号、金额分和订单标题；返回渠道拉起参数。"""

    def query(self, out_trade_no: str, mark_paid: bool = False) -> dict[str, Any]:
        """查询支付单；mark_paid 仅本地 provider 测试使用；返回渠道状态。"""

    def close(self, out_trade_no: str) -> dict[str, Any]:
        """关闭支付单；参数为商户单号；返回渠道关闭结果。"""

    def refund(self, out_trade_no: str, refund_amount_fen: int, reason: str) -> dict[str, Any]:
        """发起退款；参数为商户单号、退款金额分和原因；返回渠道退款结果。"""

    def query_refund(self, out_trade_no: str, provider_refund_no: str) -> dict[str, Any]:
        """查询退款；参数为商户单号和退款单号；返回渠道退款状态。"""

    def verify_notify(self, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
        """验签并解析通知；参数为回调头和原始载荷；返回验签后的规范化结果。"""


@dataclass(frozen=True)
class RealProviderConfig:
    provider: str
    required_fields: dict[str, str | None]

    def missing_fields(self) -> list[str]:
        return [field for field, value in self.required_fields.items() if not value]


class RealPaymentProvider:
    """真实 provider 边界：未配置时失败，避免把真实通道伪装成本地成功。"""

    def __init__(self, config: RealProviderConfig) -> None:
        self.config = config

    def create_payment(self, out_trade_no: str, amount_fen: int, subject: str) -> dict[str, Any]:
        self._ensure_configured()
        raise PaymentProviderError(
            f"{self.config.provider} payment gateway adapter is not implemented",
            status_code=501,
        )

    def query(self, out_trade_no: str, mark_paid: bool = False) -> dict[str, Any]:
        self._ensure_configured()
        raise PaymentProviderError(
            f"{self.config.provider} payment query adapter is not implemented",
            status_code=501,
        )

    def close(self, out_trade_no: str) -> dict[str, Any]:
        self._ensure_configured()
        raise PaymentProviderError(
            f"{self.config.provider} payment close adapter is not implemented",
            status_code=501,
        )

    def refund(self, out_trade_no: str, refund_amount_fen: int, reason: str) -> dict[str, Any]:
        self._ensure_configured()
        raise PaymentProviderError(
            f"{self.config.provider} payment refund adapter is not implemented",
            status_code=501,
        )

    def query_refund(self, out_trade_no: str, provider_refund_no: str) -> dict[str, Any]:
        self._ensure_configured()
        raise PaymentProviderError(
            f"{self.config.provider} refund query adapter is not implemented",
            status_code=501,
        )

    def verify_notify(self, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
        self._ensure_configured()
        raise PaymentProviderError(
            f"{self.config.provider} notify verification adapter is not implemented",
            status_code=501,
        )

    def _ensure_configured(self) -> None:
        missing = self.config.missing_fields()
        if missing:
            raise PaymentProviderError(
                f"{self.config.provider} payment provider is not configured: "
                f"missing {', '.join(missing)}",
                status_code=503,
            )


def real_provider_config(provider: str, settings: Settings) -> RealProviderConfig:
    """按 provider 汇总必需环境配置；返回值只包含存在性，不暴露密钥内容。"""
    if provider == "alipay":
        return RealProviderConfig(
            provider="alipay",
            required_fields={
                "MIMI_ALIPAY_APP_ID": settings.alipay_app_id,
                "MIMI_ALIPAY_PRIVATE_KEY": settings.alipay_private_key,
                "MIMI_ALIPAY_PUBLIC_KEY": settings.alipay_public_key,
                "MIMI_ALIPAY_NOTIFY_URL": settings.alipay_notify_url,
            },
        )
    if provider == "wechat_pay":
        return RealProviderConfig(
            provider="wechat_pay",
            required_fields={
                "MIMI_WECHAT_PAY_MCH_ID": settings.wechat_pay_mch_id,
                "MIMI_WECHAT_PAY_APP_ID": settings.wechat_pay_app_id,
                "MIMI_WECHAT_PAY_API_V3_KEY": settings.wechat_pay_api_v3_key,
                "MIMI_WECHAT_PAY_PRIVATE_KEY": settings.wechat_pay_private_key,
                "MIMI_WECHAT_PAY_SERIAL_NO": settings.wechat_pay_serial_no,
                "MIMI_WECHAT_PAY_NOTIFY_URL": settings.wechat_pay_notify_url,
            },
        )
    raise PaymentProviderError("unsupported payment provider", status_code=422)
