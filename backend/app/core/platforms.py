"""
SocialOps standardized platform definitions.
SocialOps strictly supports exactly seven social media platforms:
1. Instagram (instagram)
2. Facebook (facebook)
3. YouTube (youtube)
4. LinkedIn (linkedin)
5. WhatsApp Business (whatsapp_business)
6. X (formerly Twitter) (x)
7. Pinterest (pinterest)
"""
from enum import Enum
from typing import Dict, Set, Tuple


class SocialPlatform(str, Enum):
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    LINKEDIN = "linkedin"
    WHATSAPP_BUSINESS = "whatsapp_business"
    X = "x"
    PINTEREST = "pinterest"


SUPPORTED_PLATFORMS: Tuple[str, ...] = tuple(p.value for p in SocialPlatform)
SUPPORTED_PLATFORM_SET: Set[str] = set(SUPPORTED_PLATFORMS)

PLATFORM_DISPLAY_NAMES: Dict[str, str] = {
    SocialPlatform.INSTAGRAM.value: "Instagram",
    SocialPlatform.FACEBOOK.value: "Facebook",
    SocialPlatform.YOUTUBE.value: "YouTube",
    SocialPlatform.LINKEDIN.value: "LinkedIn",
    SocialPlatform.WHATSAPP_BUSINESS.value: "WhatsApp Business",
    SocialPlatform.X.value: "X (formerly Twitter)",
    SocialPlatform.PINTEREST.value: "Pinterest",
}

PLATFORM_ALIASES: Dict[str, str] = {
    "instagram": SocialPlatform.INSTAGRAM.value,
    "ig": SocialPlatform.INSTAGRAM.value,
    "facebook": SocialPlatform.FACEBOOK.value,
    "fb": SocialPlatform.FACEBOOK.value,
    "youtube": SocialPlatform.YOUTUBE.value,
    "yt": SocialPlatform.YOUTUBE.value,
    "linkedin": SocialPlatform.LINKEDIN.value,
    "li": SocialPlatform.LINKEDIN.value,
    "whatsapp_business": SocialPlatform.WHATSAPP_BUSINESS.value,
    "whatsapp": SocialPlatform.WHATSAPP_BUSINESS.value,
    "whatsapp business": SocialPlatform.WHATSAPP_BUSINESS.value,
    "x": SocialPlatform.X.value,
    "twitter": SocialPlatform.X.value,
    "twitter/x": SocialPlatform.X.value,
    "x (formerly twitter)": SocialPlatform.X.value,
    "pinterest": SocialPlatform.PINTEREST.value,
    "pin": SocialPlatform.PINTEREST.value,
}

# Standardized content types supported per platform
PLATFORM_CONTENT_TYPES: Dict[str, list[str]] = {
    SocialPlatform.INSTAGRAM.value: ["Feed Post", "Reel", "Carousel", "Story"],
    SocialPlatform.FACEBOOK.value: ["Feed Post", "Reel", "Photo Album", "Story"],
    SocialPlatform.YOUTUBE.value: ["Video", "Short", "Community Post"],
    SocialPlatform.LINKEDIN.value: ["Article", "Image Post", "Document Carousel", "Text Post"],
    SocialPlatform.WHATSAPP_BUSINESS.value: ["Broadcast Message", "Catalog Item", "Status Update"],
    SocialPlatform.X.value: ["Tweet / Post", "Thread", "Media Post"],
    SocialPlatform.PINTEREST.value: ["Standard Pin", "Idea Pin", "Product Pin"],
}


def normalize_platform(value: str) -> str:
    """
    Normalizes any valid platform name or alias to canonical lowercase identifier.
    Raises ValueError if the platform is not one of the exactly 7 supported platforms.
    """
    if not value or not isinstance(value, str):
        raise ValueError("Platform name must be a non-empty string.")

    cleaned = value.strip().lower()
    if cleaned in PLATFORM_ALIASES:
        return PLATFORM_ALIASES[cleaned]

    # Check if exact match to supported platform
    if cleaned in SUPPORTED_PLATFORM_SET:
        return cleaned

    supported_list = ", ".join(f"'{p}'" for p in SUPPORTED_PLATFORMS)
    raise ValueError(
        f"Unsupported platform '{value}'. SocialOps strictly supports exactly 7 platforms: {supported_list}."
    )


def get_platform_display_name(platform: str) -> str:
    """Return human-readable display name for platform, or fallback to title case."""
    norm = platform.strip().lower() if isinstance(platform, str) else ""
    return PLATFORM_DISPLAY_NAMES.get(norm, platform.title() if isinstance(platform, str) else "")

