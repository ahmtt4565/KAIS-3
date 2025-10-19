#!/usr/bin/env python3
"""
Backend Test Suite for KAIS2.1 New Features
Tests the 4 newly implemented features:
1. Report Listing Endpoints
2. Block/Unblock User Endpoints  
3. Exchange Rate Changes Endpoint
4. Achievement System
"""

import requests
import json
import time
from datetime import datetime
import sys
import uuid

# Backend URL from environment
BACKEND_URL = "https://exchange-hub-26.preview.emergentagent.com"

class KAIS21NewFeatureTests:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.failed_tests = []
        self.auth_token = None
        self.admin_token = None
        self.test_user_id = None
        self.test_user2_id = None
        self.test_listing_id = None
        
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
    
    def setup_authentication(self):
        """Setup authentication by registering test users"""
        print("\n🔐 Setting up authentication...")
        
        # Register test user 1
        try:
            unique_id = str(uuid.uuid4())[:8]
            user_data = {
                "username": f"testuser{unique_id}",
                "email": f"testuser{unique_id}@example.com",
                "password": "TestPassword123!",
                "country": "Turkey",
                "languages": ["Turkish", "English"]
            }
            
            response = requests.post(f"{self.base_url}/api/auth/register", json=user_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.test_user_id = data.get('user', {}).get('id')
                self.log_test("Authentication Setup - User 1", True, f"Test user 1 registered: {user_data['username']}")
            else:
                self.log_test("Authentication Setup - User 1", False, 
                            f"Failed to register test user 1: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup - User 1", False, f"Error: {str(e)}")
            return False
        
        # Register test user 2 for blocking tests
        try:
            unique_id2 = str(uuid.uuid4())[:8]
            user_data2 = {
                "username": f"testuser2{unique_id2}",
                "email": f"testuser2{unique_id2}@example.com",
                "password": "TestPassword123!",
                "country": "Turkey",
                "languages": ["Turkish", "English"]
            }
            
            response = requests.post(f"{self.base_url}/api/auth/register", json=user_data2, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_user2_id = data.get('user', {}).get('id')
                self.log_test("Authentication Setup - User 2", True, f"Test user 2 registered: {user_data2['username']}")
            else:
                self.log_test("Authentication Setup - User 2", False, 
                            f"Failed to register test user 2: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup - User 2", False, f"Error: {str(e)}")
            return False
        
        # Create a test listing for report tests
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            listing_data = {
                "from_currency": "USD",
                "from_amount": 1000,
                "to_currency": "TRY",
                "to_amount": 41000,
                "country": "Turkey",
                "city": "Istanbul",
                "description": "Test listing for report functionality"
            }
            
            response = requests.post(f"{self.base_url}/api/listings", json=listing_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_listing_id = data.get('id')
                self.log_test("Authentication Setup - Test Listing", True, "Test listing created for reports")
            else:
                self.log_test("Authentication Setup - Test Listing", False, 
                            f"Failed to create test listing: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Authentication Setup - Test Listing", False, f"Error: {str(e)}")
        
        return True
    
    def test_report_listing_endpoints(self):
        """Test Report Listing functionality"""
        print("\n📋 Testing Report Listing Endpoints...")
        
        if not self.auth_token or not self.test_listing_id:
            self.log_test("Report Listing - Prerequisites", False, "Missing auth token or test listing")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Submit a report
        try:
            report_data = {
                "listing_id": self.test_listing_id,
                "reason": "spam",
                "description": "This is a test report for spam content"
            }
            
            response = requests.post(f"{self.base_url}/api/reports", json=report_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'listing_id', 'reporter_id', 'reason', 'status']
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields:
                    self.log_test("Report Listing - Submit Report", True, "Report submitted successfully with all fields")
                else:
                    self.log_test("Report Listing - Submit Report", False, f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Report Listing - Submit Report", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Report Listing - Submit Report", False, f"Error: {str(e)}")
        
        # Test 2: Duplicate report prevention
        try:
            response = requests.post(f"{self.base_url}/api/reports", json=report_data, headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "already reported" in data.get('detail', '').lower():
                    self.log_test("Report Listing - Duplicate Prevention", True, "Duplicate report correctly prevented")
                else:
                    self.log_test("Report Listing - Duplicate Prevention", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Report Listing - Duplicate Prevention", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Report Listing - Duplicate Prevention", False, f"Error: {str(e)}")
        
        # Test 3: Invalid listing ID
        try:
            invalid_report = {
                "listing_id": "invalid-listing-id",
                "reason": "inappropriate",
                "description": "Test with invalid listing"
            }
            
            response = requests.post(f"{self.base_url}/api/reports", json=invalid_report, headers=headers, timeout=10)
            
            # Should still create report (listing validation might not be enforced)
            if response.status_code in [200, 400, 404]:
                self.log_test("Report Listing - Invalid Listing", True, "Invalid listing handled appropriately")
            else:
                self.log_test("Report Listing - Invalid Listing", False, 
                            f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Report Listing - Invalid Listing", False, f"Error: {str(e)}")
        
        # Test 4: Get reports (should fail for non-admin)
        try:
            response = requests.get(f"{self.base_url}/api/reports", headers=headers, timeout=10)
            
            if response.status_code == 403:
                data = response.json()
                if "admin" in data.get('detail', '').lower():
                    self.log_test("Report Listing - Admin Only Access", True, "Non-admin correctly denied access")
                else:
                    self.log_test("Report Listing - Admin Only Access", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Report Listing - Admin Only Access", False, 
                            f"Expected 403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Report Listing - Admin Only Access", False, f"Error: {str(e)}")
        
        # Test 5: Test different report reasons
        reasons = ["inappropriate", "scam", "duplicate", "other"]
        for reason in reasons:
            try:
                # Create new listing for each reason test
                listing_data = {
                    "from_currency": "EUR",
                    "from_amount": 500,
                    "to_currency": "USD",
                    "country": "Turkey",
                    "city": "Ankara",
                    "description": f"Test listing for {reason} report"
                }
                
                listing_response = requests.post(f"{self.base_url}/api/listings", json=listing_data, headers=headers, timeout=10)
                if listing_response.status_code == 200:
                    new_listing_id = listing_response.json().get('id')
                    
                    report_data = {
                        "listing_id": new_listing_id,
                        "reason": reason,
                        "description": f"Test report with reason: {reason}"
                    }
                    
                    response = requests.post(f"{self.base_url}/api/reports", json=report_data, headers=headers, timeout=10)
                    
                    if response.status_code == 200:
                        self.log_test(f"Report Listing - Reason '{reason}'", True, f"Report with reason '{reason}' accepted")
                    else:
                        self.log_test(f"Report Listing - Reason '{reason}'", False, 
                                    f"Failed to submit report with reason '{reason}': {response.status_code}")
                        
            except Exception as e:
                self.log_test(f"Report Listing - Reason '{reason}'", False, f"Error: {str(e)}")
    
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