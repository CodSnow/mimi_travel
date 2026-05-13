class LocalPaymentProvider:
    def __init__(self, channel: str) -> None:
        if channel not in {"alipay", "wechat_pay"}:
            raise ValueError("unsupported local payment channel")
        self.channel = channel

    def create_payment(self, out_trade_no: str, amount_fen: int, subject: str) -> dict:
        return {
            "channel": self.channel,
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
        return {
            "channel": self.channel,
            "out_trade_no": out_trade_no,
            "status": "paid" if mark_paid else "pending",
        }

    def close(self, out_trade_no: str) -> dict:
        return {
            "channel": self.channel,
            "out_trade_no": out_trade_no,
            "status": "closed",
        }

    def refund(self, out_trade_no: str, refund_amount_fen: int, reason: str) -> dict:
        return {
            "channel": self.channel,
            "out_trade_no": out_trade_no,
            "refund_amount_fen": refund_amount_fen,
            "reason": reason,
            "status": "success",
        }
