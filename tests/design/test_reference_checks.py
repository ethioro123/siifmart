"""Negative regression: valid color values in the wrong roles must be rejected."""
import copy
import importlib.util
import json
import re
import unittest
import sys

sys.dont_write_bytecode = True
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
module_spec = importlib.util.spec_from_file_location('reference_checks', ROOT / 'scripts/check-design-reference.py')
checks = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(checks)


class PaletteChecks(unittest.TestCase):
    def setUp(self):
        html = (ROOT / 'docs/design/examples/component-reference.html').read_text()
        self.palette = json.loads(re.search(r'<script id="reference-palette" type="application/json">(.*?)</script>', html, re.S).group(1))
        self.spec = (ROOT / 'docs/design/15-states-and-theme-pairs.md').read_text()

    def test_reference_passes(self):
        failures, count = checks.validate_palette(self.palette, self.spec)
        self.assertEqual(failures, [])
        self.assertEqual(count, 56)

    def test_swapped_existing_colors_fail_role_validation(self):
        palette = copy.deepcopy(self.palette)
        palette['light']['canvas'], palette['light']['hover'] = palette['light']['hover'], palette['light']['canvas']
        failures, _ = checks.validate_palette(palette, self.spec)
        self.assertTrue(any('canvas does not match' in failure for failure in failures))

    def test_low_contrast_is_rejected(self):
        self.palette['dark']['text'] = self.palette['dark']['surface']
        failures, _ = checks.validate_palette(self.palette, self.spec)
        self.assertTrue(any('text/surface' in failure for failure in failures))


if __name__ == '__main__':
    unittest.main()
