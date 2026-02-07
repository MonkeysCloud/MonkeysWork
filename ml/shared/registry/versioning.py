"""Model versioning utilities."""
import re
from dataclasses import dataclass


@dataclass
class ModelVersion:
    name: str
    major: int
    minor: int
    patch: int

    @property
    def display_name(self) -> str:
        return f"mw-{self.name}-v{self.major}.{self.minor}.{self.patch}"

    def bump_patch(self) -> 'ModelVersion':
        return ModelVersion(self.name, self.major, self.minor, self.patch + 1)

    def bump_minor(self) -> 'ModelVersion':
        return ModelVersion(self.name, self.major, self.minor + 1, 0)

    def bump_major(self) -> 'ModelVersion':
        return ModelVersion(self.name, self.major + 1, 0, 0)

    @classmethod
    def parse(cls, display_name: str) -> 'ModelVersion':
        match = re.match(r'mw-(.+)-v(\d+)\.(\d+)\.(\d+)', display_name)
        if not match:
            raise ValueError(f"Invalid model version format: {display_name}")
        return cls(
            name=match.group(1),
            major=int(match.group(2)),
            minor=int(match.group(3)),
            patch=int(match.group(4)),
        )
