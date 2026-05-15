class LocalPaymentProvider:
    """本地支付 provider，用于开发和测试环境，不模拟真实渠道成功。"""

    def __init__(self, channel: str) -> None:
        if channel not in {"alipay", "wechat_pay"}:
            raise ValueError("unsupported local payment channel")
        self.channel = channel

    def create_payment(self, out_trade_no: str, amount_fen: int, subject: str) -> dict:
        """创建本地待支付单；参数为商户单号、金额分和标题；返回本地拉起参数。"""
        return {
            "channel": self.channel,
            "provider": "local",
            "status": "pending",
            "out_trade_no": out_trade_no,
            "amount_fen": amount_fen,
            "subject": subject,
            "pay_url": f"mimi-travel://local-pay/{self.channel}/{out_trade_no}",
            "app_params": {
                "channel": self.channel,
                "outTradeNo": out_trade_no,
                "amountFen": str(amount_fen),
            },
        }

    def query(self, out_trade_no: str, mark_paid: bool = False) -> dict:
        """查询本地支付单；mark_paid 用于测试支付完成路径；返回本地状态。"""
        return {
            "channel": self.channel,
            "provider": "local",
            "out_trade_no": out_trade_no,
            "status": "paid" if mark_paid else "pending",
        }

    def close(self, out_trade_no: str) -> dict:
        """关闭本地支付单；参数为商户单号；返回关闭状态。"""
        return {
            "channel": self.channel,
            "provider": "local",
            "out_trade_no": out_trade_no,
            "status": "closed",
        }

    def refund(self, out_trade_no: str, refund_amount_fen: int, reason: str) -> dict:
        """本地退款；参数为商户单号、退款金额分和原因；返回退款成功状态。"""
        return {
            "channel": self.channel,
            "provider": "local",
            "out_trade_no": out_trade_no,
            "refund_amount_fen": refund_amount_fen,
            "reason": reason,
            "status": "success",
        }

    def query_refund(self, out_trade_no: str, provider_refund_no: str) -> dict:
        """查询本地退款；参数为商户单号和退款单号；返回本地退款状态。"""
        return {
            "channel": self.channel,
            "provider": "local",
            "out_trade_no": out_trade_no,
            "provider_refund_no": provider_refund_no,
            "status": "success",
        }

    def verify_notify(self, headers: dict[str, str], payload: dict) -> dict:
        """承接本地通知验签；本地通知无签名，仅回传已验签的规范化结果。"""
        return {
            "channel": self.channel,
            "provider": "local",
            "verified": True,
            "payload": payload,
        }
