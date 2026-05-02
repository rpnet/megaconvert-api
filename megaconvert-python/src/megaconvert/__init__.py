"""MegaConvert — convert files between 500+ formats via the MegaConvert API."""

from .client import MegaConvert
from .exceptions import MegaConvertError

__version__ = "1.0.0"
__all__ = ["MegaConvert", "MegaConvertError"]
