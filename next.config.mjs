/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Header links
      {
        source: '/features',
        destination: '/home/features',
      },
      {
        source: '/for-schools',
        destination: '/home/for-schools',
      },
      {
        source: '/contact',
        destination: '/home/contact',
      },
      {
        source: '/sign-in',
        destination: '/home/sign-in',
      },
      // Footer links
      {
        source: '/lux-libris-award',
        destination: '/home/lux-libris-award',
      },
      {
        source: '/classroom-reading',
        destination: '/home/classroom-reading',
      },
      {
        source: '/luxlings',
        destination: '/home/luxlings',
      },
      {
        source: '/demo',
        destination: '/home/demo',
      },
      {
        source: '/help-center',
        destination: '/home/help-center',
      },
      {
        source: '/licensing-inquiries',
        destination: '/home/licensing-inquiries',
      },
      {
        source: '/partnerships',
        destination: '/home/partnerships',
      },
      // Other pages
      {
        source: '/role-selector',
        destination: '/home/role-selector',
      },
    ]
  },
};

export default nextConfig;