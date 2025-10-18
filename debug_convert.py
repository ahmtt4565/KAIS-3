#!/usr/bin/env python3
"""
Debug script to test the convert function logic
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def test_convert_logic():
    """Test the exact logic from the convert function"""
    
    # Setup database connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        print("🔍 Testing convert function logic...")
        
        # Step 1: Get latest rates (same as convert function)
        print("Step 1: Fetching exchange rates from database...")
        rate_data = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("last_updated", -1)])
        
        if not rate_data:
            print("❌ No rate_data found - this would cause 503 error")
            return
        else:
            print("✅ Rate data found")
        
        # Step 2: Extract rates and base
        rates = rate_data.get("rates", {})
        base = rate_data.get("base_currency", "USD")
        
        print(f"Base currency: {base}")
        print(f"Number of rates: {len(rates)}")
        
        # Step 3: Test conversion logic
        amount = 100
        from_currency = "USD"
        to_currency = "EUR"
        
        # Convert currencies
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        print(f"Converting {amount} {from_currency} to {to_currency}")
        
        # Check if currencies are supported
        if from_currency not in rates and from_currency != base:
            print(f"❌ Currency {from_currency} not supported")
            return
        
        if to_currency not in rates and to_currency != base:
            print(f"❌ Currency {to_currency} not supported")
            return
        
        print("✅ Both currencies are supported")
        
        # Calculate conversion
        if from_currency == base:
            converted_amount = amount * rates.get(to_currency, 1)
            print(f"Base to other: {amount} * {rates.get(to_currency)} = {converted_amount}")
        elif to_currency == base:
            converted_amount = amount / rates.get(from_currency, 1)
            print(f"Other to base: {amount} / {rates.get(from_currency)} = {converted_amount}")
        else:
            amount_in_base = amount / rates.get(from_currency, 1)
            converted_amount = amount_in_base * rates.get(to_currency, 1)
            print(f"Cross conversion: {amount} / {rates.get(from_currency)} * {rates.get(to_currency)} = {converted_amount}")
        
        result = {
            "amount": amount,
            "from_currency": from_currency,
            "to_currency": to_currency,
            "converted_amount": round(converted_amount, 2),
            "rate": round(converted_amount / amount, 6) if amount > 0 else 0,
            "last_updated": rate_data.get("last_updated")
        }
        
        print("✅ Conversion successful!")
        print(f"Result: {result}")
        
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_convert_logic())