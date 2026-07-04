import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';

@Global()
@Module({
  imports: [JwtModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
