/**
 * Middleware de API - Validações centralizadas
 * Funções reutilizáveis para validar requests em rotas de API
 */

import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';

/**
 * Valida campos obrigatórios no body do request
 * @param {Request} request - Request do Next.js
 * @param {string[]} requiredFields - Array de campos obrigatórios
 * @returns {Promise<{valid: boolean, body?: object, response?: NextResponse}>}
 *
 * @example
 * const validation = await validateRequest(request, ['userId', 'avatarId']);
 * if (!validation.valid) return validation.response;
 * const { userId, avatarId } = validation.body;
 */
export async function validateRequest(request, requiredFields) {
  let body;

  try {
    body = await request.json();
  } catch (error) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Request body inválido' },
        { status: 400 }
      )
    };
  }

  for (const field of requiredFields) {
    if (!body[field]) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: `${field} é obrigatório` },
          { status: 400 }
        )
      };
    }
  }

  return { valid: true, body };
}

/**
 * Valida se avatar existe e pertence ao usuário
 * @param {string} avatarId - ID do avatar
 * @param {string} userId - ID do usuário
 * @returns {Promise<{valid: boolean, avatar?: object, response?: NextResponse}>}
 *
 * @example
 * const avatarCheck = await validateAvatarOwnership(avatarId, userId);
 * if (!avatarCheck.valid) return avatarCheck.response;
 * const avatar = avatarCheck.avatar;
 */
export async function validateAvatarOwnership(avatarId, userId) {
  const avatar = await getDocument('avatares', avatarId);

  if (!avatar) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      )
    };
  }

  if (avatar.user_id !== userId) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Este avatar não pertence a você' },
        { status: 403 }
      )
    };
  }

  return { valid: true, avatar };
}

/**
 * Valida se avatar está vivo
 * @param {object} avatar - Objeto do avatar
 * @returns {{valid: boolean, response?: NextResponse}}
 *
 * @example
 * const aliveCheck = validateAvatarIsAlive(avatar);
 * if (!aliveCheck.valid) return aliveCheck.response;
 */
export function validateAvatarIsAlive(avatar) {
  if (avatar.status === 'morto') {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Avatar está morto' },
        { status: 400 }
      )
    };
  }

  return { valid: true };
}

/**
 * Valida se avatar pode lutar (não está exausto)
 * @param {object} avatar - Objeto do avatar
 * @returns {{valid: boolean, response?: NextResponse}}
 *
 * @example
 * const battleCheck = validateCanBattle(avatar);
 * if (!battleCheck.valid) return battleCheck.response;
 */
export function validateCanBattle(avatar) {
  if ((avatar.exaustao || 0) >= 80) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Avatar está muito exausto para lutar' },
        { status: 400 }
      )
    };
  }

  return { valid: true };
}

/**
 * Valida nome de avatar
 * @param {string} nome - Nome para validar
 * @param {number} minLength - Comprimento mínimo (padrão: 3)
 * @param {number} maxLength - Comprimento máximo (padrão: 30)
 * @returns {{valid: boolean, nome?: string, error?: string}}
 *
 * @example
 * const nameCheck = validateAvatarName(novoNome);
 * if (!nameCheck.valid) {
 *   return NextResponse.json({ error: nameCheck.error }, { status: 400 });
 * }
 * const nomeValidado = nameCheck.nome;
 */
export function validateAvatarName(nome, minLength = 3, maxLength = 30) {
  const nomeValidado = nome.trim();

  if (nomeValidado.length < minLength) {
    return {
      valid: false,
      error: `O nome deve ter no mínimo ${minLength} caracteres`
    };
  }

  if (nomeValidado.length > maxLength) {
    return {
      valid: false,
      error: `O nome deve ter no máximo ${maxLength} caracteres`
    };
  }

  const regexNomeValido = /^[a-zA-ZÀ-ÿ0-9\s'\-]+$/;
  if (!regexNomeValido.test(nomeValidado)) {
    return {
      valid: false,
      error: 'Nome contém caracteres inválidos'
    };
  }

  return { valid: true, nome: nomeValidado };
}

/**
 * Valida se usuário tem recursos suficientes
 * @param {object} usuario - Objeto do usuário (com moedas, fragmentos, etc)
 * @param {object} custo - Objeto com custos {moedas?: number, fragmentos?: number}
 * @returns {{valid: boolean, response?: NextResponse}}
 *
 * @example
 * const resourceCheck = validateResources(usuario, { moedas: 100 });
 * if (!resourceCheck.valid) return resourceCheck.response;
 */
export function validateResources(usuario, custo) {
  if (custo.moedas && (usuario.moedas || 0) < custo.moedas) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: `Moedas insuficientes. Necessário: ${custo.moedas}, Disponível: ${usuario.moedas || 0}` },
        { status: 400 }
      )
    };
  }

  if (custo.fragmentos && (usuario.fragmentos || 0) < custo.fragmentos) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: `Fragmentos insuficientes. Necessário: ${custo.fragmentos}, Disponível: ${usuario.fragmentos || 0}` },
        { status: 400 }
      )
    };
  }

  return { valid: true };
}

/**
 * Valida que avatar não tem marca da morte
 * @param {object} avatar - Objeto do avatar
 * @returns {{valid: boolean, response?: NextResponse}}
 *
 * @example
 * const markCheck = validateNoDeathMark(avatar);
 * if (!markCheck.valid) return markCheck.response;
 */
export function validateNoDeathMark(avatar) {
  if (avatar.marca_morte) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Avatar possui marca da morte e não pode ser usado' },
        { status: 400 }
      )
    };
  }

  return { valid: true };
}

/**
 * Helper: Combina múltiplas validações
 * Útil para validar avatar completo (vivo + sem marca + pode lutar)
 *
 * @example
 * const checks = combineValidations([
 *   validateAvatarIsAlive(avatar),
 *   validateCanBattle(avatar),
 *   validateNoDeathMark(avatar)
 * ]);
 * if (!checks.valid) return checks.response;
 */
export function combineValidations(validations) {
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }
  return { valid: true };
}
