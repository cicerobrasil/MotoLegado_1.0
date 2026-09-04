import { PilotProfile } from '../context/AuthContext';

export interface PlanPermissionResult {
  allowed: boolean;
  reason?: string;
  featureTitle: string;
  limit?: number;
  current?: number;
}

/**
 * Checks if a pilot has full VIP privileges (Pro subscriber, Bonificado VIP, or Admin)
 */
export function isUserProOrBonificado(profile: PilotProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  if (profile.plan_type === 'bonificado') return true;
  if (profile.plan_type === 'pago') return true;
  if (profile.is_pro) return true;
  return false;
}

/**
 * Validates permission to create new logbook trips (Max 5 per month for Free plan)
 */
export function canCreateLogbookTrip(
  profile: PilotProfile | null | undefined,
  monthlyLogsCount: number
): PlanPermissionResult {
  const isVip = isUserProOrBonificado(profile);
  const FREE_LIMIT = 5;

  if (isVip) {
    return {
      allowed: true,
      featureTitle: 'Diário de Bordo Ilimitado'
    };
  }

  if (monthlyLogsCount >= FREE_LIMIT) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${FREE_LIMIT} registros de viagens deste mês no Plano Gratuito.`,
      featureTitle: 'Diário de Bordo Ilimitado',
      limit: FREE_LIMIT,
      current: monthlyLogsCount
    };
  }

  return {
    allowed: true,
    featureTitle: 'Diário de Bordo',
    limit: FREE_LIMIT,
    current: monthlyLogsCount
  };
}

/**
 * Validates permission to create/fund a Moto Clube
 */
export function canCreateMotoClub(profile: PilotProfile | null | undefined): PlanPermissionResult {
  const isVip = isUserProOrBonificado(profile);
  if (isVip) {
    return {
      allowed: true,
      featureTitle: 'Fundação e Gestão de Moto Clube'
    };
  }
  return {
    allowed: false,
    reason: 'A fundação e gestão completa de Moto Clubes é exclusiva para pilotos MotoLegado Pro ou Modo Bonificado.',
    featureTitle: 'Fundação e Gestão de Moto Clube'
  };
}

/**
 * Validates permission to create events
 */
export function canCreateEvent(profile: PilotProfile | null | undefined): PlanPermissionResult {
  const isVip = isUserProOrBonificado(profile);
  if (isVip) {
    return {
      allowed: true,
      featureTitle: 'Criação e Agendamento de Eventos'
    };
  }
  return {
    allowed: false,
    reason: 'O agendamento e criação de eventos coletivos é exclusivo para pilotos MotoLegado Pro ou com Modo Bonificado.',
    featureTitle: 'Criação e Agendamento de Eventos'
  };
}

/**
 * Validates permission to create routes
 */
export function canCreateRoute(profile: PilotProfile | null | undefined): PlanPermissionResult {
  const isVip = isUserProOrBonificado(profile);
  if (isVip) {
    return {
      allowed: true,
      featureTitle: 'Criação e Publicação de Roteiros'
    };
  }
  return {
    allowed: false,
    reason: 'A criação e compartilhamento de roteiros e expedições é exclusivo para pilotos MotoLegado Pro ou com Modo Bonificado.',
    featureTitle: 'Criação e Publicação de Roteiros'
  };
}

/**
 * Validates permission to access VIP partner discounts (over standard open community discounts)
 */
export function canAccessVipPartnerDiscount(profile: PilotProfile | null | undefined): PlanPermissionResult {
  const isVip = isUserProOrBonificado(profile);
  if (isVip) {
    return {
      allowed: true,
      featureTitle: 'Descontos VIP na Rede de Parceiros'
    };
  }
  return {
    allowed: false,
    reason: 'O resgate de cupons com descontos de até 20% em oficinas, hotéis e lojas parceiras é exclusivo para pilotos Pro ou Bonificados.',
    featureTitle: 'Descontos VIP na Rede de Parceiros'
  };
}
