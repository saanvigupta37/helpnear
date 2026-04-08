// ONLY showing FIXED PARTS — rest stays same

const handleSubmit = async () => {
  // 🔥 FIX 1: Ensure user exists
  if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
  }

  if (!helpType) {
      Alert.alert('Missing info', 'Please select what kind of help you need.');
      return;
  }

  // 🔥 FIX 2: Spam detection
  if (detectSpam(note, 0)) {
      Alert.alert('Request blocked', 'Your request looks like spam.');
      return;
  }

  // 🔥 FIX 3: Cooldown
  if (cooldownSecs > 0) {
      const mins = Math.ceil(cooldownSecs / 60);
      Alert.alert('Please wait', `Try again in ${mins} min`);
      return;
  }

  let coords = location;

  // 🔥 FIX 4: Proper location handling
  if (!coords) {
      const granted = await requestPermission();
      if (!granted) {
          Alert.alert('Location needed', 'Enable location to continue.');
          return;
      }

      // 🚨 CRITICAL: fetch location again
      coords = await new Promise((resolve) => {
          setTimeout(() => resolve(location), 1000);
      });
  }

  if (!coords) {
      Alert.alert('Error', 'Could not get location. Try again.');
      return;
  }

  // 🔥 FIX 5: CLEAN PAYLOAD (VERY IMPORTANT)
  const payload = {
      type: helpType,
      urgency,
      time_needed: timeNeeded,
      note: note.trim() || null,
      status: 'Open',
      lat: coords.latitude,
      lng: coords.longitude,
      requested_by: user.id, // ✅ FIXED (no optional)
  };

  console.log('CREATING REQUEST:', payload); // 🔥 DEBUG

  setLoading(true);

  if (!isOnline) {
      await enqueue('help_requests', payload);
      setLoading(false);
      Alert.alert('Queued offline');
      router.back();
      return;
  }

  const { data, error } = await supabase
      .from('help_requests')
      .insert(payload)
      .select()
      .single();

  setLoading(false);

  // 🔥 FIX 6: SHOW REAL ERROR
  if (error) {
      console.error('CREATE ERROR:', error.message);
      Alert.alert('Error', error.message);
      return;
  }

  console.log('SUCCESS:', data);

  logEvent('request_created', {
      type: helpType,
      urgency,
      ai_suggested: aiSuggested,
  });

  router.replace(`/request/${data.id}`);
};