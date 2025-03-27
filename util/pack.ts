export const generateRandomPackName = () => {
    const adjectives = ['Swift', 'Mighty', 'Brave', 'Fierce', 'Strong', 'Epic', 'Daring', 'Bold'];
    const nouns = ['Pack', 'Crew', 'Squad', 'Team', 'Tribe', 'Gang', 'Alliance', 'Legion'];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdjective} ${randomNoun}`;
  };