from django.test import SimpleTestCase

from payments.kenya_phone import normalize_ke_mpesa_phone_loose, normalize_kenya_payment_phone


class KenyaPhoneTests(SimpleTestCase):
    def test_landlord_payment_phone_strict_2547(self):
        self.assertEqual(normalize_kenya_payment_phone("254712345678"), "254712345678")
        self.assertEqual(normalize_kenya_payment_phone("0712345678"), "254712345678")
        self.assertIsNone(normalize_kenya_payment_phone("254112345678"))

    def test_tenant_mpesa_loose(self):
        self.assertEqual(normalize_ke_mpesa_phone_loose("254112345678"), "254112345678")
        self.assertEqual(normalize_ke_mpesa_phone_loose("0112345678"), "254112345678")
