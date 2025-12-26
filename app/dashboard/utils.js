/**
 * Converte Firestore Timestamp para objeto Date
 */
export function converterFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;

  try {
    // Firestore Timestamp tem método toDate()
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    // Firestore Timestamp pode vir como objeto com seconds
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    // ISO string ou timestamp number
    return new Date(timestamp);
  } catch (error) {
    console.error('Erro ao converter timestamp:', error);
    return null;
  }
}

/**
 * Calcula dias desde o registro
 */
export function calcularDiasRegistro(createdAt) {
  const dataRegistro = converterFirestoreTimestamp(createdAt);

  if (!dataRegistro || isNaN(dataRegistro.getTime())) {
    return 0;
  }

  const hoje = new Date();
  const diferencaMs = hoje - dataRegistro;
  const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

  return dias === 0 ? 1 : dias;
}

/**
 * Formata data de registro no formato DD/MM/YYYY
 */
export function formatarDataRegistro(createdAt) {
  const data = converterFirestoreTimestamp(createdAt);

  if (!data || isNaN(data.getTime())) {
    return "Data não disponível";
  }

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

/**
 * Gera código de caçador a partir do userId
 */
export function gerarCodigoCacador(userId) {
  if (!userId) return "HNT-000-000";
  const prefixo = userId.slice(0, 3).toUpperCase();
  const sufixo = userId.slice(-3).toUpperCase();
  return `HNT-${prefixo}-${sufixo}`;
}

/**
 * Gera nome de caçador padrão a partir do email
 */
export function gerarNomeCacadorPadrao(email) {
  if (!email) return "Caçador";
  const username = email.split('@')[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
}

/**
 * Retorna emoji do elemento do avatar
 */
export function getEmojiElemento(elemento) {
  const emojis = {
    'Fogo': '🔥',
    'Água': '💧',
    'Terra': '🪨',
    'Vento': '💨',
    'Eletricidade': '⚡',
    'Sombra': '🌑',
    'Luz': '✨'
  };

  return emojis[elemento] || '🛡️';
}
