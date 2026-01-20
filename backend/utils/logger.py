"""
Centralized logging configuration for Tripzy backend admin scripts.

This module provides a standardized logging setup for all admin utilities,
replacing print() statements with proper structured logging.

Usage:
    from utils.logger import get_logger
    
    logger = get_logger(__name__)
    logger.info("Operation started")
    logger.error("Operation failed", exc_info=True)
"""
import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional

# Log levels
DEBUG = logging.DEBUG
INFO = logging.INFO
WARNING = logging.WARNING
ERROR = logging.ERROR
CRITICAL = logging.CRITICAL

# Default configuration
DEFAULT_LEVEL = INFO
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Log directory
LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

class ColoredFormatter(logging.Formatter):
    """
    Colored formatter for console output.
    """
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }

    def format(self, record):
        log_color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        record.levelname = f"{log_color}{record.levelname}{self.COLORS['RESET']}"
        return super().format(record)

def get_logger(
    name: str,
    level: int = DEFAULT_LEVEL,
    log_file: Optional[str] = None,
    console: bool = True
) -> logging.Logger:
    """
    Get or create a logger with standard configuration.
    
    Args:
        name: Logger name (usually __name__)
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file to write logs to
        console: Whether to output to console
    
    Returns:
        Configured logger instance
    
    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Script started")
        >>> logger.error("Failed to connect", exc_info=True)
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Console handler with colors
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_formatter = ColoredFormatter(LOG_FORMAT, datefmt=DATE_FORMAT)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        file_path = LOG_DIR / log_file
        file_handler = logging.FileHandler(file_path, encoding='utf-8')
        file_handler.setLevel(level)
        file_formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger

def mask_sensitive_data(data: dict) -> dict:
    """
    Mask sensitive information in log data.
    
    Args:
        data: Dictionary potentially containing sensitive keys
    
    Returns:
        Dictionary with sensitive values masked
    
    Example:
        >>> data = {"api_key": "secret123", "user": "john"}
        >>> mask_sensitive_data(data)
        {"api_key": "***REDACTED***", "user": "john"}
    """
    sensitive_keys = ['key', 'token', 'password', 'secret', 'auth']
    masked = data.copy()
    
    for key, value in masked.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            masked[key] = "***REDACTED***"
    
    return masked

# Global admin logger for quick use
admin_logger = get_logger(
    "tripzy.admin",
    level=INFO,
    log_file=f"admin_{datetime.now().strftime('%Y%m%d')}.log"
)

if __name__ == "__main__":
    # Test the logger
    test_logger = get_logger(__name__)
    test_logger.debug("Debug message")
    test_logger.info("Info message")
    test_logger.warning("Warning message")
    test_logger.error("Error message")
    test_logger.critical("Critical message")
    
    # Test masking
    test_data = {
        "api_key": "secret123",
        "user_id": "user456",
        "password": "pass789"
    }
    print(f"\nOriginal: {test_data}")
    print(f"Masked: {mask_sensitive_data(test_data)}")
