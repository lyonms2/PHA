export default function Pagination({
  paginaAtual,
  totalPaginas,
  onMudarPagina,
  corTema = 'cyan' // 'cyan', 'amber', 'pink', 'purple'
}) {
  if (totalPaginas <= 1) return null;

  const cores = {
    cyan: {
      ativo: 'border-cyan-500 bg-cyan-900/80 text-cyan-300',
      hover: 'hover:text-cyan-400 hover:border-cyan-500/50'
    },
    amber: {
      ativo: 'border-amber-500 bg-amber-900/80 text-amber-300',
      hover: 'hover:text-amber-400 hover:border-amber-500/50'
    },
    pink: {
      ativo: 'border-pink-500 bg-pink-900/80 text-pink-300',
      hover: 'hover:text-pink-400 hover:border-pink-500/50'
    },
    purple: {
      ativo: 'border-purple-500 bg-purple-900/80 text-purple-300',
      hover: 'hover:text-purple-400 hover:border-purple-500/50'
    }
  };

  const tema = cores[corTema] || cores.cyan;

  // Calcular quais páginas mostrar
  const paginas = [];
  const maxBotoes = 5; // máx 5 botões de número em mobile

  if (totalPaginas <= maxBotoes) {
    // Se tem poucas páginas, mostra todas
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
  } else {
    // Sempre mostra primeira
    paginas.push(1);

    // Páginas do meio
    let inicio = Math.max(2, paginaAtual - 1);
    let fim = Math.min(totalPaginas - 1, paginaAtual + 1);

    // Ajustar para sempre mostrar 3 do meio quando possível
    if (paginaAtual <= 2) {
      fim = Math.min(4, totalPaginas - 1);
    } else if (paginaAtual >= totalPaginas - 1) {
      inicio = Math.max(totalPaginas - 3, 2);
    }

    // Adicionar elipse antes se necessário
    if (inicio > 2) {
      paginas.push('...');
    }

    // Adicionar páginas do meio
    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }

    // Adicionar elipse depois se necessário
    if (fim < totalPaginas - 1) {
      paginas.push('...');
    }

    // Sempre mostra última
    if (totalPaginas > 1) {
      paginas.push(totalPaginas);
    }
  }

  return (
    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
      {/* Botão Anterior */}
      <button
        onClick={() => onMudarPagina(Math.max(1, paginaAtual - 1))}
        disabled={paginaAtual === 1}
        className={`
          w-full sm:w-auto
          px-4 sm:px-6 py-3 sm:py-2.5
          bg-slate-900/50 border border-slate-700 rounded-lg
          text-slate-400 font-mono text-sm sm:text-base
          transition-all
          ${tema.hover}
          disabled:opacity-30 disabled:cursor-not-allowed
          disabled:hover:text-slate-400 disabled:hover:border-slate-700
          active:scale-95
        `}
        aria-label="Página anterior"
      >
        <span className="hidden sm:inline">←</span> Anterior
      </button>

      {/* Números de Página */}
      <div className="flex gap-2 justify-center flex-wrap">
        {paginas.map((num, idx) => {
          if (num === '...') {
            return (
              <span
                key={`elipse-${idx}`}
                className="text-slate-600 px-1 sm:px-2 flex items-center"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const estaAtivo = num === paginaAtual;

          return (
            <button
              key={num}
              onClick={() => onMudarPagina(num)}
              className={`
                min-w-[44px] min-h-[44px]
                sm:w-10 sm:h-10
                rounded-lg border-2
                font-mono text-sm sm:text-base font-bold
                transition-all active:scale-95
                ${estaAtivo
                  ? tema.ativo
                  : 'border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                }
              `}
              aria-label={`Página ${num}`}
              aria-current={estaAtivo ? 'page' : undefined}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Botão Próxima */}
      <button
        onClick={() => onMudarPagina(Math.min(totalPaginas, paginaAtual + 1))}
        disabled={paginaAtual === totalPaginas}
        className={`
          w-full sm:w-auto
          px-4 sm:px-6 py-3 sm:py-2.5
          bg-slate-900/50 border border-slate-700 rounded-lg
          text-slate-400 font-mono text-sm sm:text-base
          transition-all
          ${tema.hover}
          disabled:opacity-30 disabled:cursor-not-allowed
          disabled:hover:text-slate-400 disabled:hover:border-slate-700
          active:scale-95
        `}
        aria-label="Próxima página"
      >
        Próxima <span className="hidden sm:inline">→</span>
      </button>
    </div>
  );
}
