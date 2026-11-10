// Cloudflare Worker and Node-compatibility type declarations
declare module 'cloudflare:node' {
  export function httpServerHandler(
    target: any
  ): {
    fetch: (request: Request, env?: any, ctx?: any) => Promise<Response>;
    [key: string]: any;
  };
}

declare module 'cloudflare:workers' {
  export const env: Record<string, any>;
}
