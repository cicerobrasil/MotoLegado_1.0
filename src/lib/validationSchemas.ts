import { z } from 'zod';

/**
 * ============================================================================
 * SCHEMAS DE VALIDAÇÃO COM ZOD (MotoLegado)
 * ============================================================================
 * Força a validação rigorosa de tipos, tamanhos e formatos no lado do cliente
 * antes de qualquer envio de dados para as APIs e banco de dados.
 */

// 1. Autenticação: Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('Formato de e-mail inválido.')
    .min(5, 'E-mail muito curto.')
    .max(100, 'E-mail muito longo.'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória.')
});

// 2. Autenticação: Cadastro de Novo Piloto
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('Formato de e-mail inválido.')
    .min(5, 'E-mail muito curto.')
    .max(100, 'E-mail muito longo.'),
  password: z
    .string()
    .min(6, 'A senha deve conter no mínimo 6 caracteres.')
    .max(100, 'A senha é muito longa.'),
  motorcycle: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  bloodType: z.string().max(10).optional(),
  blood_type: z.string().max(10).optional(),
  emergencyContact: z.string().max(150).optional(),
  emergency_contact: z.string().max(150).optional(),
  emergencyPhone: z.string().max(30).optional(),
  emergency_phone: z.string().max(30).optional(),
  healthNotes: z.string().max(1000).optional(),
  health_notes: z.string().max(1000).optional(),
}).passthrough();

// 3. Autenticação: Recuperação de Senha
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('Formato de e-mail inválido.')
});

// 4. Autenticação: Redefinição de Senha
export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório.').email('Formato de e-mail inválido.'),
  code: z.string().optional(),
  new_password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
  security_answer: z.string().optional(),
});

// 5. Autenticação: Alteração de Senha em Perfil
export const changePasswordSchema = z.object({
  pilot_id: z.string().min(1, 'ID do piloto é obrigatório.'),
  current_password: z.string().min(1, 'A senha atual é obrigatória.'),
  new_password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
});

// 6. Perfil do Piloto
export const pilotProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(100),
  email: z.string().email('Formato de e-mail inválido.').optional(),
  motorcycle: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  city: z.string().max(60).optional(),
  state: z.string().max(10).optional(),
  bio: z.string().max(500, 'Biografia deve ter até 500 caracteres.').optional(),
  bloodType: z.string().max(10).optional(),
  blood_type: z.string().max(10).optional(),
  emergencyContact: z.string().max(150).optional(),
  emergency_contact: z.string().max(150).optional(),
  emergencyPhone: z.string().max(30).optional(),
  emergency_phone: z.string().max(30).optional(),
  healthNotes: z.string().max(1000).optional(),
  health_notes: z.string().max(1000).optional(),
  motoClub: z.string().max(100).optional(),
  avatar_url: z.string().optional(),
  avatar: z.string().optional(),
  plan: z.enum(['gratuito', 'pago', 'bonificado']).optional(),
  role: z.enum(['pilot', 'admin']).optional(),
}).passthrough();

// 7. Diário de Bordo (Viagem / Trip)
export const tripSchema = z.object({
  id: z.string().optional(),
  pilot_id: z.string().optional(),
  title: z.string().min(2, 'O destino ou título da viagem é obrigatório.').max(150),
  origin: z.string().max(100).optional(),
  destination: z.string().max(100).optional(),
  date: z.string().min(1, 'A data da viagem é obrigatória.'),
  distance: z.coerce.number().min(0, 'A distância não pode ser negativa.'),
  duration: z.string().max(50).optional(),
  motorcycle: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['completed', 'planned', 'in_progress']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  proofs: z.array(z.any()).optional(),
}).passthrough();

// 8. Roteiro de Moto (Route)
export const routeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O título do roteiro deve conter pelo menos 3 caracteres.').max(150),
  mapsAddress: z.string().min(2, 'O endereço ou query do Google Maps é obrigatório.').max(250),
  mapsUrl: z.string().optional(),
  description: z.string().min(5, 'A descrição do roteiro é obrigatória.').max(3000),
  riderTips: z.string().max(3000).optional(),
  difficulty: z.enum(['Fácil', 'Médio', 'Difícil', 'Especialista']),
  image: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
  duration: z.string().optional(),
  startPoint: z.string().optional(),
  endPoint: z.string().optional(),
  status: z.enum(['aprovado', 'pendente', 'rejeitado']).optional(),
  rejectionReason: z.string().optional(),
}).passthrough();

// 9. Evento Motociclístico (MotoEvent)
export const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'O título do evento deve conter pelo menos 3 caracteres.').max(150),
  desc: z.string().min(5, 'A descrição do evento é obrigatória.').max(3000),
  date: z.string().min(1, 'A data inicial do evento é obrigatória.'),
  endDate: z.string().optional(),
  time: z.string().min(1, 'O horário inicial é obrigatório.'),
  endTime: z.string().optional(),
  location: z.string().min(2, 'A localização do evento é obrigatória.').max(200),
  distance: z.coerce.number().min(0).optional(),
  category: z.string().min(1, 'Selecione uma categoria para o evento.'),
  image: z.string().min(1, 'A imagem de capa do evento é obrigatória.'),
  organizer: z.string().max(100).optional(),
  status: z.enum(['aprovado', 'pendente', 'rejeitado']).optional(),
  rejectionReason: z.string().optional(),
  checkedIn: z.boolean().optional(),
  memberCount: z.coerce.number().optional(),
}).passthrough();

// 10. Cadastro de Parceiro (Partner)
export const partnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do estabelecimento parceiro é obrigatório.').max(150),
  category: z.enum([
    'Bar e Point',
    'Alimentação',
    'Oficina',
    'Serviços',
    'Acessórios',
    'Cursos e Treinamentos',
    'Hospedagem',
    'Combustível'
  ]),
  location: z.string().min(2, 'A localização/endereço é obrigatória.').max(200),
  discount: z.string().min(2, 'O benefício ou desconto exclusivo é obrigatório.').max(150),
  news: z.string().max(1000).optional(),
  image: z.string().min(1, 'A logomarca do estabelecimento é obrigatória.'),
  photos: z.array(z.string()).max(4, 'É permitido o upload de até 4 fotos do estabelecimento.').optional(),
  corporateContact: z.string().max(100).optional(),
  phone: z.string().min(8, 'O telefone de contato é obrigatório (mínimo 8 dígitos).').max(30),
  whatsapp: z.string().max(30).optional(),
  website: z.string().max(250).optional(),
  mapUrl: z.string().max(500).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  highlight: z.boolean().optional(),
  status: z.enum(['aprovado', 'pendente', 'rejeitado']).optional(),
}).passthrough();

// 11. Mural da Comunidade (CommunityPost)
export const communityPostSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(2, 'A publicação deve conter pelo menos 2 caracteres.').max(2000),
  category: z.string().optional(),
  image: z.string().optional(),
  user: z.object({
    name: z.string().min(1),
    avatar: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
  status: z.enum(['aprovado', 'pendente', 'rejeitado']).optional(),
  rejectionReason: z.string().optional(),
}).passthrough();

// 12. Motoclubes (Club)
export const clubSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do motoclube é obrigatório.').max(150),
  city: z.string().min(2, 'A cidade é obrigatória.').max(100),
  state: z.string().min(2, 'O estado é obrigatório.').max(50),
  president: z.string().max(100).optional(),
  contact: z.string().max(50).optional(),
  foundationYear: z.union([z.number(), z.string()]).optional(),
  logo: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

export interface ValidationSuccess<T> {
  success: true;
  data: T;
  error?: undefined;
  issues?: undefined;
}

export interface ValidationFailure {
  success: false;
  error: string;
  issues: any[];
  data?: undefined;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Função utilitária genérica para validação segura com Zod no cliente
 * Retorna { success: true, data } ou { success: false, error: string, issues }
 */
export function validateWithZod<T>(schema: z.ZodType<T, any, any>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.issues?.[0]?.message || 'Dados inválidos fornecidos no formulário.';
    return {
      success: false,
      error: errorMsg,
      issues: result.error.issues || [],
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

export default {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  pilotProfileSchema,
  tripSchema,
  routeSchema,
  eventSchema,
  partnerSchema,
  communityPostSchema,
  clubSchema,
  validateWithZod,
};
