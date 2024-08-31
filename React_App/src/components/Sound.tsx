function soundEffect(sound: string) {
    const audio = new Audio(sound);
    audio.volume = 0.09; // Ajusta el volumen al 25%
    audio.play();
  }
  
  export { soundEffect };