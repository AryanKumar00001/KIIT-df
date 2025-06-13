export const INTERESTS_CATEGORIES = {
  Academic: [
    "Coding",
    "Data Science",
    "AI/ML",
    "Web Development",
    "Mobile Development",
    "Research",
    "Cybersecurity",
    "Cloud Computing",
    "Blockchain",
    "IoT",
    "Robotics",
    "UI/UX Design",
  ],
  Sports: [
    "Basketball",
    "Football",
    "Cricket",
    "Tennis",
    "Badminton",
    "Swimming",
    "Volleyball",
    "Table Tennis",
    "Chess",
    "Running",
    "Cycling",
    "Yoga",
  ],
  Creative: [
    "Photography",
    "Art & Design",
    "Video Editing",
    "Music Production",
    "Writing",
    "Dancing",
    "Drawing",
    "Painting",
    "Crafts",
    "Fashion Design",
    "Animation",
    "Graphic Design",
  ],
  Entertainment: [
    "Gaming",
    "Anime",
    "Podcasts",
    "Movies",
    "Reading",
    "Travel",
    "Cooking",
    "Baking",
    "Music",
    "TV Shows",
    "Concerts",
    "Board Games",
  ],
  
}

// Create a flattened array of all interests for search functionality
export const ALL_INTERESTS = Object.values(INTERESTS_CATEGORIES).flat()


export const SOCIETIES = {
  
  Societies:[
    "KdeWreck",
    "Kinecta",
    "AI Soc",
    "Society 1",
    "Society 2",
    "Society 3",
    "Society 4",
  ]
}

// Create a flattened array of all interests for search functionality
export const ALL_SOCIETIES = Object.values(SOCIETIES).flat()
