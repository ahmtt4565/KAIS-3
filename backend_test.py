#!/usr/bin/env python3
"""
Backend Test Suite for KAIS2.1 Exchange Rate Endpoints
Tests the newly implemented live exchange rate integration
"""

import requests
import json
import time
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://kais-mobile-mvp.preview.emergentagent.com"

class ExchangeRateTests:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        if not success:
            self.failed_tests.append(result)
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_get_exchange_rates(self):
        """Test GET /api/exchange-rates endpoint"""
        print("\n🧪 Testing GET /api/exchange-rates endpoint...")
        
        try:
            url = f"{self.base_url}/api/exchange-rates"
            response = requests.get(url, timeout=10)
            
            # Test 1: Response status code
            if response.status_code == 200:
                self.log_test("GET /api/exchange-rates - Status Code", True, "Returns 200 OK")
            else:
                self.log_test("GET /api/exchange-rates - Status Code", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                return
            
            # Parse response
            try:
                data = response.json()
            except json.JSONDecodeError:
                self.log_test("GET /api/exchange-rates - JSON Parse", False, 
                            "Response is not valid JSON", response.text)
                return
            
            # Test 2: Base currency is USD
            base_currency = data.get('base_currency')
            if base_currency == 'USD':
                self.log_test("GET /api/exchange-rates - Base Currency", True, "Base currency is USD")
            else:
                self.log_test("GET /api/exchange-rates - Base Currency", False, 
                            f"Expected USD, got {base_currency}", data)
            
            # Test 3: Rates object exists and has currencies
            rates = data.get('rates', {})
            if isinstance(rates, dict) and len(rates) > 0:
                self.log_test("GET /api/exchange-rates - Rates Object", True, 
                            f"Rates object contains {len(rates)} currencies")
            else:
                self.log_test("GET /api/exchange-rates - Rates Object", False, 
                            "Rates object is empty or invalid", data)
                return
            
            # Test 4: Check for specific currencies (TRY, EUR, GBP)
            required_currencies = ['TRY', 'EUR', 'GBP']
            missing_currencies = []
            for currency in required_currencies:
                if currency not in rates:
                    missing_currencies.append(currency)
            
            if not missing_currencies:
                self.log_test("GET /api/exchange-rates - Required Currencies", True, 
                            "TRY, EUR, GBP are present")
            else:
                self.log_test("GET /api/exchange-rates - Required Currencies", False, 
                            f"Missing currencies: {missing_currencies}", data)
            
            # Test 5: Last updated timestamp
            last_updated = data.get('last_updated')
            if last_updated:
                try:
                    # Try to parse ISO timestamp
                    datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
                    self.log_test("GET /api/exchange-rates - Last Updated", True, 
                                "Valid ISO timestamp present")
                except ValueError:
                    self.log_test("GET /api/exchange-rates - Last Updated", False, 
                                f"Invalid timestamp format: {last_updated}", data)
            else:
                self.log_test("GET /api/exchange-rates - Last Updated", False, 
                            "No last_updated timestamp", data)
            
            # Test 6: Response time
            response_time = response.elapsed.total_seconds()
            if response_time < 2.0:
                self.log_test("GET /api/exchange-rates - Response Time", True, 
                            f"Response time: {response_time:.2f}s")
            else:
                self.log_test("GET /api/exchange-rates - Response Time", False, 
                            f"Response time too slow: {response_time:.2f}s")
            
            # Store rates for conversion tests
            self.rates_data = data
            
        except requests.exceptions.RequestException as e:
            self.log_test("GET /api/exchange-rates - Network", False, f"Network error: {str(e)}")
        except Exception as e:
            self.log_test("GET /api/exchange-rates - General", False, f"Unexpected error: {str(e)}")
    
    def test_currency_conversion(self):
        """Test GET /api/exchange-rates/convert endpoint"""
        print("\n🧪 Testing GET /api/exchange-rates/convert endpoint...")
        
        # Test cases for conversion
        test_cases = [
            {
                'name': 'USD to EUR (100)',
                'params': {'amount': 100, 'from_currency': 'USD', 'to_currency': 'EUR'},
                'expected_fields': ['amount', 'from_currency', 'to_currency', 'converted_amount', 'rate', 'last_updated']
            },
            {
                'name': 'TRY to USD (1000)',
                'params': {'amount': 1000, 'from_currency': 'TRY', 'to_currency': 'USD'},
                'expected_fields': ['amount', 'from_currency', 'to_currency', 'converted_amount', 'rate', 'last_updated']
            },
            {
                'name': 'EUR to GBP (50)',
                'params': {'amount': 50, 'from_currency': 'EUR', 'to_currency': 'GBP'},
                'expected_fields': ['amount', 'from_currency', 'to_currency', 'converted_amount', 'rate', 'last_updated']
            },
            {
                'name': 'Zero amount (0)',
                'params': {'amount': 0, 'from_currency': 'USD', 'to_currency': 'EUR'},
                'expected_fields': ['amount', 'from_currency', 'to_currency', 'converted_amount', 'rate', 'last_updated']
            },
            {
                'name': 'Large amount (999999)',
                'params': {'amount': 999999, 'from_currency': 'USD', 'to_currency': 'EUR'},
                'expected_fields': ['amount', 'from_currency', 'to_currency', 'converted_amount', 'rate', 'last_updated']
            }
        ]
        
        for test_case in test_cases:
            self._test_single_conversion(test_case)
        
        # Test error cases
        self._test_conversion_errors()
    
    def _test_single_conversion(self, test_case):
        """Test a single conversion case"""
        try:
            url = f"{self.base_url}/api/exchange-rates/convert"
            response = requests.get(url, params=test_case['params'], timeout=10)
            
            # Test status code
            if response.status_code == 200:
                self.log_test(f"Convert {test_case['name']} - Status", True, "Returns 200 OK")
            else:
                self.log_test(f"Convert {test_case['name']} - Status", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                return
            
            # Parse response
            try:
                data = response.json()
            except json.JSONDecodeError:
                self.log_test(f"Convert {test_case['name']} - JSON", False, 
                            "Response is not valid JSON", response.text)
                return
            
            # Test required fields
            missing_fields = []
            for field in test_case['expected_fields']:
                if field not in data:
                    missing_fields.append(field)
            
            if not missing_fields:
                self.log_test(f"Convert {test_case['name']} - Fields", True, 
                            "All required fields present")
            else:
                self.log_test(f"Convert {test_case['name']} - Fields", False, 
                            f"Missing fields: {missing_fields}", data)
            
            # Test conversion logic
            amount = test_case['params']['amount']
            converted_amount = data.get('converted_amount', 0)
            rate = data.get('rate', 0)
            
            # For zero amount, converted amount should be zero
            if amount == 0:
                if converted_amount == 0:
                    self.log_test(f"Convert {test_case['name']} - Zero Logic", True, 
                                "Zero amount returns zero conversion")
                else:
                    self.log_test(f"Convert {test_case['name']} - Zero Logic", False, 
                                f"Zero amount should return zero, got {converted_amount}")
            else:
                # Check if rate calculation is consistent
                expected_converted = amount * rate
                if abs(expected_converted - converted_amount) < 0.01:  # Allow small rounding differences
                    self.log_test(f"Convert {test_case['name']} - Math", True, 
                                "Conversion math is consistent")
                else:
                    self.log_test(f"Convert {test_case['name']} - Math", False, 
                                f"Math inconsistent: {amount} * {rate} ≠ {converted_amount}")
            
            # Test response time
            response_time = response.elapsed.total_seconds()
            if response_time < 2.0:
                self.log_test(f"Convert {test_case['name']} - Response Time", True, 
                            f"Response time: {response_time:.2f}s")
            else:
                self.log_test(f"Convert {test_case['name']} - Response Time", False, 
                            f"Response time too slow: {response_time:.2f}s")
                
        except requests.exceptions.RequestException as e:
            self.log_test(f"Convert {test_case['name']} - Network", False, f"Network error: {str(e)}")
        except Exception as e:
            self.log_test(f"Convert {test_case['name']} - General", False, f"Unexpected error: {str(e)}")
    
    def _test_conversion_errors(self):
        """Test error handling in conversion endpoint"""
        print("\n🧪 Testing conversion error handling...")
        
        # Test invalid currency
        try:
            url = f"{self.base_url}/api/exchange-rates/convert"
            params = {'amount': 100, 'from_currency': 'XYZ', 'to_currency': 'USD'}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'XYZ not supported' in data.get('detail', ''):
                    self.log_test("Convert Error - Invalid Currency", True, 
                                "Returns 400 with proper error message")
                else:
                    self.log_test("Convert Error - Invalid Currency", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Convert Error - Invalid Currency", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Convert Error - Invalid Currency", False, f"Error: {str(e)}")
        
        # Test missing parameters
        try:
            url = f"{self.base_url}/api/exchange-rates/convert"
            params = {'amount': 100}  # Missing currencies
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Convert Error - Missing Params", True, 
                            "Returns 422 for missing parameters")
            else:
                self.log_test("Convert Error - Missing Params", False, 
                            f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Convert Error - Missing Params", False, f"Error: {str(e)}")
    
    def test_data_persistence(self):
        """Test that exchange rates are properly stored and retrieved"""
        print("\n🧪 Testing data persistence...")
        
        # Make two requests and compare timestamps
        try:
            url = f"{self.base_url}/api/exchange-rates"
            
            # First request
            response1 = requests.get(url, timeout=10)
            if response1.status_code != 200:
                self.log_test("Data Persistence - First Request", False, 
                            f"First request failed: {response1.status_code}")
                return
            
            data1 = response1.json()
            timestamp1 = data1.get('last_updated')
            
            # Wait a moment
            time.sleep(1)
            
            # Second request
            response2 = requests.get(url, timeout=10)
            if response2.status_code != 200:
                self.log_test("Data Persistence - Second Request", False, 
                            f"Second request failed: {response2.status_code}")
                return
            
            data2 = response2.json()
            timestamp2 = data2.get('last_updated')
            
            # Timestamps should be the same (data is cached)
            if timestamp1 == timestamp2:
                self.log_test("Data Persistence - Caching", True, 
                            "Exchange rates are properly cached")
            else:
                self.log_test("Data Persistence - Caching", False, 
                            f"Timestamps differ: {timestamp1} vs {timestamp2}")
            
            # Rates should be identical
            rates1 = data1.get('rates', {})
            rates2 = data2.get('rates', {})
            
            if rates1 == rates2:
                self.log_test("Data Persistence - Data Consistency", True, 
                            "Exchange rates data is consistent")
            else:
                self.log_test("Data Persistence - Data Consistency", False, 
                            "Exchange rates data differs between requests")
                
        except Exception as e:
            self.log_test("Data Persistence - General", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all exchange rate tests"""
        print("🚀 Starting KAIS2.1 Exchange Rate API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests
        self.test_get_exchange_rates()
        self.test_currency_conversion()
        self.test_data_persistence()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = ExchangeRateTests()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)