class MegaConvertError(Exception):
    """Raised when the MegaConvert API returns an error."""

    def __init__(self, message: str, code: str = "unknown", status: int = 0):
        super().__init__(message)
        self.code = code
        self.status = status

    def __str__(self) -> str:
        return f"[{self.status} {self.code}] {super().__str__()}"
