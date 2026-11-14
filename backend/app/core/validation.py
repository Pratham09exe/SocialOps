import re
from fastapi import HTTPException, status

GMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@gmail\.com$", re.IGNORECASE)

def normalize_and_validate_gmail(email: str) -> str:
    """
    Normalizes an email address by trimming whitespace and converting to lowercase.
    Strictly verifies that the email address ends in @gmail.com.
    Rejects Yahoo, Outlook, custom domains, and invalid formats.
    """
    if not email or not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required."
        )

    cleaned = email.strip().lower()

    if not cleaned.endswith("@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @gmail.com email addresses are permitted on SocialOps. Please enter a valid Gmail address."
        )

    if not GMAIL_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Gmail format. Please enter a valid username before @gmail.com."
        )

    return cleaned

