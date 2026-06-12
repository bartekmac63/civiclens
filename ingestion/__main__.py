"""Run a sync with ``python -m ingestion``."""

import sys

from ingestion.sync import main

if __name__ == "__main__":
    sys.exit(main())
