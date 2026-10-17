export class DorisioClient {
  config: Record<string, unknown>;
  constructor(config: Record<string, unknown> = {}) {
    this.config = config;
  }
  isSandboxMode(): boolean {
    return false;
  }
  getMode(): string {
    return 'live';
  }
}

export default DorisioClient;
