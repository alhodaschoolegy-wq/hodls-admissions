import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/dashboard(.html)?',
    '/students(.html)?',
    '/settings(.html)?',
    '/users(.html)?'
  ],
};

export function middleware(request) {
  const sessionCookie = request.cookies.get('hodls_admin_session');
  
  if (!sessionCookie || !sessionCookie.value) {
    // Redirect to login page if no session cookie exists
    return NextResponse.redirect(new URL('/admin.html', request.url));
  }
  
  // Allow request if cookie exists (token validation happens in the API routes)
  return NextResponse.next();
}
