import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import users from "../data/users.json"

/**
 * Retrieves the current authenticated user based on the JWT stored in cookies.
 * Returns null if no valid token is found or the user does not exist.
 */
export async function getCurrentUser(): Promise<null | {
  id: string;
  name: string;
  username: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const { id } = verifyToken(token);

    // Look for the user in the JSON file
    const user = users.find((u) => u.id === id);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      username: user.username
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}