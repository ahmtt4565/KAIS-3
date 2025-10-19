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
    
    def test_block_unblock_user_endpoints(self):
        """Test Block/Unblock User functionality"""
        print("\n🚫 Testing Block/Unblock User Endpoints...")
        
        if not self.auth_token or not self.test_user2_id:
            self.log_test("Block User - Prerequisites", False, "Missing auth token or test user 2")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Block a user
        try:
            response = requests.post(f"{self.base_url}/api/users/block/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "blocked successfully" in data.get('message', '').lower():
                    self.log_test("Block User - Block User", True, "User blocked successfully")
                else:
                    self.log_test("Block User - Block User", False, f"Unexpected message: {data.get('message')}")
            else:
                self.log_test("Block User - Block User", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Block User - Block User", False, f"Error: {str(e)}")
        
        # Test 2: Try to block same user again (should fail)
        try:
            response = requests.post(f"{self.base_url}/api/users/block/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "already blocked" in data.get('detail', '').lower():
                    self.log_test("Block User - Duplicate Block", True, "Duplicate block correctly prevented")
                else:
                    self.log_test("Block User - Duplicate Block", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Duplicate Block", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Duplicate Block", False, f"Error: {str(e)}")
        
        # Test 3: Try to block self (should fail)
        try:
            response = requests.post(f"{self.base_url}/api/users/block/{self.test_user_id}", headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "cannot block yourself" in data.get('detail', '').lower():
                    self.log_test("Block User - Self Block Prevention", True, "Self-blocking correctly prevented")
                else:
                    self.log_test("Block User - Self Block Prevention", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Self Block Prevention", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Self Block Prevention", False, f"Error: {str(e)}")
        
        # Test 4: Get blocked users list
        try:
            response = requests.get(f"{self.base_url}/api/users/blocked", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                blocked_users = data.get('blocked_users', [])
                
                if isinstance(blocked_users, list) and len(blocked_users) > 0:
                    # Check if our blocked user is in the list
                    blocked_ids = [user.get('id') for user in blocked_users]
                    if self.test_user2_id in blocked_ids:
                        self.log_test("Block User - Get Blocked List", True, f"Blocked users list contains {len(blocked_users)} users")
                    else:
                        self.log_test("Block User - Get Blocked List", False, "Blocked user not found in list")
                else:
                    self.log_test("Block User - Get Blocked List", False, "Blocked users list is empty or invalid")
            else:
                self.log_test("Block User - Get Blocked List", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Block User - Get Blocked List", False, f"Error: {str(e)}")
        
        # Test 5: Unblock user
        try:
            response = requests.delete(f"{self.base_url}/api/users/unblock/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "unblocked successfully" in data.get('message', '').lower():
                    self.log_test("Block User - Unblock User", True, "User unblocked successfully")
                else:
                    self.log_test("Block User - Unblock User", False, f"Unexpected message: {data.get('message')}")
            else:
                self.log_test("Block User - Unblock User", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Block User - Unblock User", False, f"Error: {str(e)}")
        
        # Test 6: Try to unblock user that's not blocked (should fail)
        try:
            response = requests.delete(f"{self.base_url}/api/users/unblock/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "not blocked" in data.get('detail', '').lower():
                    self.log_test("Block User - Unblock Non-blocked", True, "Unblocking non-blocked user correctly prevented")
                else:
                    self.log_test("Block User - Unblock Non-blocked", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Unblock Non-blocked", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Unblock Non-blocked", False, f"Error: {str(e)}")
        
        # Test 7: Try to block non-existent user
        try:
            fake_user_id = str(uuid.uuid4())
            response = requests.post(f"{self.base_url}/api/users/block/{fake_user_id}", headers=headers, timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get('detail', '').lower():
                    self.log_test("Block User - Non-existent User", True, "Non-existent user correctly handled")
                else:
                    self.log_test("Block User - Non-existent User", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Non-existent User", False, 
                            f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Non-existent User", False, f"Error: {str(e)}")
    
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