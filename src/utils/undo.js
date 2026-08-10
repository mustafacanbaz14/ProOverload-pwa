/** Bir kimliğe göre siler ve aynı sıraya geri koymak için yeterli anlık görüntüyü döndürür. */
export const removeById = (list = [], id) => {
  const safe = Array.isArray(list) ? list : [];
  const index = safe.findIndex(item => item?.id === id);
  if (index < 0) return { next: safe, record: null, index: -1 };
  return {
    next: safe.filter((_, itemIndex) => itemIndex !== index),
    record: safe[index],
    index,
  };
};

/** Kayıt başka bir yoldan zaten geri geldiyse çoğaltmaz. */
export const restoreAtIndex = (list = [], snapshot) => {
  const safe = Array.isArray(list) ? list : [];
  if (!snapshot?.record?.id || safe.some(item => item?.id === snapshot.record.id)) return safe;
  const next = [...safe];
  const index = Math.max(0, Math.min(snapshot.index, next.length));
  next.splice(index, 0, snapshot.record);
  return next;
};

/** İç içe kardiyo kaydını kaldırır; boş kalan kardiyo seansını da temizler. */
export const removeCardioEntry = (workouts = [], workoutId, cardioId) => {
  const safe = Array.isArray(workouts) ? workouts : [];
  const workoutIndex = safe.findIndex(item => item?.id === workoutId);
  const workout = safe[workoutIndex];
  const cardioIndex = (workout?.cardio || []).findIndex(item => item?.id === cardioId);
  if (!workout || cardioIndex < 0) return { next: safe, snapshot: null };

  const cardio = workout.cardio[cardioIndex];
  const remainingCardio = workout.cardio.filter((_, index) => index !== cardioIndex);
  const removeWholeWorkout = (workout.exercises || []).length === 0 && remainingCardio.length === 0;
  const next = removeWholeWorkout
    ? safe.filter((_, index) => index !== workoutIndex)
    : safe.map((item, index) => index === workoutIndex ? { ...item, cardio: remainingCardio } : item);

  return {
    next,
    snapshot: { workout, workoutId, workoutIndex, cardio, cardioIndex, removeWholeWorkout },
  };
};

/** Kardiyo seansı hâlâ varsa yalnız kaydı, tamamen silindiyse seansın tamamını geri getirir. */
export const restoreCardioEntry = (workouts = [], snapshot) => {
  const safe = Array.isArray(workouts) ? workouts : [];
  if (!snapshot?.cardio?.id) return safe;
  const currentIndex = safe.findIndex(item => item?.id === snapshot.workoutId);

  if (currentIndex < 0) {
    const next = [...safe];
    next.splice(Math.max(0, Math.min(snapshot.workoutIndex, next.length)), 0, snapshot.workout);
    return next;
  }

  const current = safe[currentIndex];
  if ((current.cardio || []).some(item => item?.id === snapshot.cardio.id)) return safe;
  const cardio = [...(current.cardio || [])];
  cardio.splice(Math.max(0, Math.min(snapshot.cardioIndex, cardio.length)), 0, snapshot.cardio);
  return safe.map((item, index) => index === currentIndex ? { ...item, cardio } : item);
};
