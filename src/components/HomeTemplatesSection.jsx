import React, { memo } from 'react';
import { BookmarkPlus, ChevronRight, Clock, Layers, Pencil, Star, Trash2 } from 'lucide-react';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import { organizeTemplates } from '../utils/templateLibrary';

const HomeTemplatesSection = memo(({
  templates = [],
  customExercises = [],
  restSeconds = 120,
  interfaceMode = 'simple',
  onOpenTraining,
  onOpenTemplateBuilder,
  onPreviewTemplate,
  onEditTemplate,
  onToggleTemplateFavorite,
  handleStartRequest,
  setDeleteConfirm,
}) => {
  const orderedTemplates = organizeTemplates(templates);
  const visibleTemplates = interfaceMode === 'simple'
    ? orderedTemplates.slice(0, 3)
    : orderedTemplates;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
          <BookmarkPlus size={13} className="mr-2 text-cyan-400" /> {interfaceMode === 'simple' ? 'Öne Çıkan Şablonlar' : 'Şablonlar'}
        </h3>
        {templates.length > 0 && (
          <button onClick={() => onOpenTraining?.()} className="text-[8px] font-bold text-cyan-400 flex items-center">
            Tümünü Yönet <ChevronRight size={11} />
          </button>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="p-5 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto">
            <BookmarkPlus size={16} className="text-zinc-600" />
          </div>
          <p className="text-[11px] font-bold text-zinc-300">Henüz şablon yok</p>
          <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
            Sık yaptığın antrenmanı şablona çevirirsen tek dokunuşla başlatırsın.
            Antrenman bitince &quot;Şablon Yap&quot; ile kaydedebilir ya da baştan
            bir program kurabilirsin.
          </p>
          <button
            onClick={() => onOpenTemplateBuilder?.()}
            className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 active:bg-cyan-900/40 px-4 py-2 rounded-xl transition-colors"
          >
            Program Oluştur
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-800">
            {visibleTemplates.map(template => {
              const { byMuscle, totalSets } = previewTemplateVolume(template.exercises, customExercises);
              const minutes = estimateDuration(template.exercises, restSeconds);
              const top = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 3);

              return (
                <div key={template.id} className="p-3 space-y-2 defer-card-render">
                  <div className="flex justify-between items-start gap-2">
                    <button
                      onClick={() => onPreviewTemplate?.(template)}
                      className="min-w-0 flex-1 text-left active:opacity-70 transition-opacity"
                    >
                      <span className="text-xs font-bold text-cyan-400 truncate flex items-center">
                        <span className="truncate">{template.name}</span>
                        <ChevronRight size={13} className="ml-1 shrink-0 text-zinc-600" />
                      </span>
                      <span className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-500">
                        <span className="flex items-center"><Clock size={10} className="mr-1" />~{minutes} dk</span>
                        <span className="flex items-center"><Layers size={10} className="mr-1" />{totalSets} set</span>
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onToggleTemplateFavorite?.(template)}
                        title={template.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        aria-label={template.favorite ? 'Şablonu favorilerden çıkar' : 'Şablonu favorilere ekle'}
                        className={`p-1.5 ${template.favorite ? 'text-amber-400' : 'text-zinc-600 active:text-amber-400'}`}
                      >
                        <Star size={13} fill={template.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => handleStartRequest(template)} className="bg-cyan-900/30 active:bg-cyan-900/60 text-cyan-400 border border-cyan-800 text-[10px] font-bold py-1.5 px-3 rounded-lg uppercase tracking-wider">Başlat</button>
                      <button onClick={() => onEditTemplate?.(template)} title="Şablonu düzenle" aria-label="Şablonu düzenle" className="text-zinc-600 active:text-cyan-400 p-1.5"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'template', id: template.id })} title="Şablonu sil" aria-label="Şablonu sil" className="text-zinc-600 active:text-red-500 p-1.5"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {top.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {top.map(([muscle, volume]) => (
                        <span key={muscle} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
                          {muscle} <strong className="text-cyan-400">{volume}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {interfaceMode === 'simple' && orderedTemplates.length > visibleTemplates.length && (
            <button onClick={() => onOpenTraining?.()} className="w-full border-t border-zinc-800 py-2.5 text-[9px] font-bold text-zinc-500 active:text-cyan-400">
              {orderedTemplates.length - visibleTemplates.length} şablon daha · kütüphaneyi aç
            </button>
          )}
        </>
      )}
    </div>
  );
});

HomeTemplatesSection.displayName = 'HomeTemplatesSection';
export default HomeTemplatesSection;
