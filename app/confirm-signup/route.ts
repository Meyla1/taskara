import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const confirmationUrl =
    request.nextUrl.searchParams.get('confirmation_url');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!confirmationUrl || !supabaseUrl) {
    return new NextResponse(
      'Tautan konfirmasi tidak lengkap.',
      { status: 400 }
    );
  }

  try {
    const target = new URL(confirmationUrl);
    const expectedOrigin = new URL(supabaseUrl).origin;

    if (
      target.origin !== expectedOrigin ||
      target.pathname !== '/auth/v1/verify'
    ) {
      return new NextResponse(
        'Tautan konfirmasi tidak valid.',
        { status: 400 }
      );
    }

    return NextResponse.redirect(target, 302);
  } catch {
    return new NextResponse(
      'Tautan konfirmasi tidak valid.',
      { status: 400 }
    );
  }
}