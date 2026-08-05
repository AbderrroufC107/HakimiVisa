import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Blocks partner agencies from the desk's own work — moving a case through
 * the pipeline, booking appointments, recording a decision, messaging the
 * client. An agency deposits and follows; it does not decide.
 *
 * Deliberately narrow: it refuses the AGENCY role and leaves every existing
 * role exactly as it was.
 */
@Injectable()
export class DeskOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.role === 'AGENCY') {
      throw new ForbiddenException(
        "Cette action est réservée à l'agence principale. Votre accès permet de déposer des dossiers et d'en suivre l'avancement.",
      );
    }
    return true;
  }
}
