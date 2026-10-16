import unittest
from datetime import date

from pydantic import ValidationError

from app.schemas import CandidateIn, ContractIn, EmployeeIn, LeaveIn, PayrollIn


class ValidationRulesTest(unittest.TestCase):
    def base_employee(self, **overrides):
        data = {
            "employee_code": "NV001",
            "full_name": "Nguyen Van A",
            "email": "a@example.com",
            "phone": "0912345678",
            "base_salary": 10_000_000,
        }
        data.update(overrides)
        return data

    def test_phone_more_than_10_digits_is_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeIn(**self.base_employee(phone="09123456789"))

    def test_phone_with_letters_is_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeIn(**self.base_employee(phone="09123abc78"))

    def test_employee_name_with_digits_is_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeIn(**self.base_employee(full_name="Nguyen Van A123"))

    def test_negative_salary_is_rejected(self):
        with self.assertRaises(ValidationError):
            EmployeeIn(**self.base_employee(base_salary=-1))

    def test_leave_end_before_start_is_rejected(self):
        with self.assertRaises(ValidationError):
            LeaveIn(employee_id=1, start_date=date(2026, 10, 20), end_date=date(2026, 10, 19))

    def test_invalid_payroll_month_is_rejected(self):
        with self.assertRaises(ValidationError):
            PayrollIn(employee_id=1, month=13, year=2026, base_salary=10_000_000)

    def test_deduction_over_income_is_rejected(self):
        with self.assertRaises(ValidationError):
            PayrollIn(employee_id=1, month=10, year=2026, base_salary=10_000_000, deduction=11_000_000)

    def test_contract_end_before_start_is_rejected(self):
        with self.assertRaises(ValidationError):
            ContractIn(employee_id=1, contract_no="HD001", start_date=date(2026, 10, 20), end_date=date(2026, 10, 19))

    def test_candidate_phone_more_than_10_digits_is_rejected(self):
        with self.assertRaises(ValidationError):
            CandidateIn(full_name="Tran Thi B", email="b@example.com", phone="09123456789")


if __name__ == "__main__":
    unittest.main()
