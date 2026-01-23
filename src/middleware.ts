import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('__session');

    // Return to /login if no session exists for protected routes
    // For now, we'll assume pages inside (admin), (driver), etc are protected
    // But since we don't have a rigid folder structure for all protected routes yet (some are at root),
    // we'll rely on specific path checks.

    const isAuthPage = request.nextUrl.pathname === '/login'; // If login page existed separately
    const isPublicApi = request.nextUrl.pathname.startsWith('/api/auth');

    // Paths that REQUIRE auth
    const protectedPaths = [
        '/admin',
        '/driver',
        '/vehicles',
        '/storage',
        '/quote',
        '/tracking',
        '/my-services'
    ];

    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isProtected && !session) {
        // Redirect to Home (Login is on Home)
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-based protection (can be expanded by decoding the cookie, 
    // but simplified check is good for now. Real verification happens in API/Page).
    // Note: To verify claims in middleware we'd need a library or external call, 
    // or just let the page/API handle specific permission errors.
    // For Phase 1, basic Auth Guard is sufficient here, let Components handle granular RBAC.

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
