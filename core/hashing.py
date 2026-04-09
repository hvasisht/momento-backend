import farmhash
import struct
import hashlib


def make_user_id(character_name: str) -> int:
    """Replicate BQ user_id: farmhash64 of full name → signed 64-bit → abs."""
    raw = farmhash.hash64(character_name)
    signed = struct.unpack('q', struct.pack('Q', raw))[0]
    return abs(signed)


def compute_passage_key(book_id: str, passage: str) -> str:
    """SHA256 of book_id|passage[:200] → 32-char hex. Same passage = same key."""
    text = str(book_id) + "|" + passage[:200].lower().strip()
    return hashlib.sha256(text.encode()).hexdigest()[:32]


def make_run_id(user_a: int, user_b: int, book_id: str, passage_id: str) -> int:
    """farmhash64 of concatenated run params → signed 64-bit → abs."""
    raw = farmhash.hash64(str(user_a) + str(user_b) + book_id + passage_id)
    signed = struct.unpack('q', struct.pack('Q', raw))[0]
    return abs(signed)
