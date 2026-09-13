from supabase import create_client, Client
from app.core.config import settings

url: str = settings.SUPABASE_URL
key: str = settings.SUPABASE_SERVICE_ROLE_KEY

# Using the service role key as requested for backend data operations
supabase_client: Client = create_client(url, key)
