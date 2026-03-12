import React from 'react';
import { motion } from 'motion/react';
import { Terminal, ChevronRight } from 'lucide-react';
import { Game } from '../types';
import GameCard from '../components/game/GameCard';
import FeaturedCarousel from '../components/game/FeaturedCarousel';

interface StoreProps {
  games: Game[];
  library: number[];
  filteredGames: Game[];
  dbError: string | null;
  onAddToLibrary: (gameId: number) => void;
  onSelectGame: (game: Game) => void;
}

const SectionHeader = ({ title, showViewMore = true }: { title: string, showViewMore?: boolean }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
      <span className="w-1 h-6 bg-neon-cyan inline-block skew-x-[-15deg]" />
      {title}
    </h3>
    {showViewMore && (
      <button className="text-[10px] font-black tracking-widest text-white/40 hover:text-neon-cyan flex items-center gap-1 transition-colors">
        VIEW_ALL <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default function Store({ games, library, filteredGames, dbError, onAddToLibrary, onSelectGame }: StoreProps) {
  // Categorize games for different sections
  const trendingGames = [...filteredGames].reverse().slice(0, 6);
  const newlyAdded = [...filteredGames].slice(0, 6);

  return (
    <motion.div
      key="store"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-12"
    >
      {/* Featured Hero Carousel */}
      {!dbError && games.length > 0 && (
        <FeaturedCarousel
          games={games}
          onBuy={onAddToLibrary}
          library={library}
        />
      )}

      {dbError && (
        <div className="p-8 border border-neon-magenta/30 bg-neon-magenta/5 rounded-2xl flex flex-col items-center gap-4">
          <Terminal className="w-12 h-12 text-neon-magenta" />
          <div className="text-center">
            <p className="text-neon-magenta font-black italic tracking-tighter">CRITICAL_ERROR: GRID_OFFLINE</p>
            <p className="text-white/60 text-xs font-mono mt-2">
              The database connection failed. Please verify your <span className="text-neon-cyan">DATABASE_URL</span> environment variable.
            </p>
          </div>
        </div>
      )}

      {/* Trending Section */}
      <section>
        <SectionHeader title="TRENDING_NOW" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingGames.map((game) => (
            <GameCard
              key={`trending-${game.id}`}
              game={game}
              onBuy={() => onAddToLibrary(game.id)}
              onSelect={() => onSelectGame(game)}
              owned={library.includes(game.id)}
              onViewLibrary={() => onTabChange('library')}
              onSelectGame={() => onSelectGame(game)}
            />
          ))}
        </div>
      </section>

      {/* Grid Layout Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        <section>
          <SectionHeader title="MOST_DOWNLOADED" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {newlyAdded.map((game) => (
              <GameCard
                key={`added-${game.id}`}
                game={game}
                onBuy={() => onAddToLibrary(game.id)}
                onSelect={() => onSelectGame(game)}
                owned={library.includes(game.id)}
              />
            ))}
          </div>
        </section>

        {/* Sidebar Mini Section */}
        <aside className="space-y-8">
          <div>
            <SectionHeader title="TOP_SELLERS" showViewMore={false} />
            <div className="space-y-4">
              {games.slice(0, 5).map((game, i) => (
                <div key={`top-${game.id}`} className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <span className="text-xs font-black text-white/20 italic">{i + 1}</span>
                  <img src={game.image} className="w-12 h-16 object-cover rounded shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate group-hover:text-neon-cyan">{game.title}</p>
                    <p className="text-[10px] text-white/40 italic">${game.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-linear-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/20 rounded-xl space-y-3">
            <h4 className="text-xs font-black italic">GRID_MEMBERSHIP</h4>
            <p className="text-[10px] text-white/60 leading-relaxed font-mono">Unlock exclusive glitched content and early access to experimental protocols.</p>
            <button className="w-full py-2 bg-white text-black text-[10px] font-black hover:bg-neon-cyan transition-colors">JOIN_SYSTEM</button>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
