/*
export const SelectBudgetOptions = [
    {
        id: 1,
        icon: "💵",
        title: "Cheap",
        desc: "Economize and Save"
    },
    {
        id: 2,
        icon: "💰",
        title: "Moderate",
        desc: "Balance Cost and Comfort"
    },
    {
        id: 3,
        icon: "💎",
        title: "Luxury",
        desc: "Indulge without Limits"
    },
]

export const SelectNoOfPersons = [
    {
        id: 1,
        icon: "🚶",
        title: "Solo",
        desc: "Discovering on Your Own",
        no: "1 Person"
    },
    {
        id: 2,
        icon: "💑",
        title: "Partner",
        desc: "Exploring with a Loved One",
        no: "2 People"
    },
    {
        id: 3,
        icon: "👨‍👩‍👧‍👦",
        title: "Family",
        desc: "Fun for All Ages",
        no: "3 to 5 People"
    },
    {
        id: 4,
        icon: "🤝",
        title: "Friends",
        desc: "Adventure with Your Crew",
        no: "5 to 10 People"
    },
]

export const PROMPT = "Create an optimal trip itinerary based on the specified location, duration, budget, and number of persons. Generate Travel Plan for Location: {location} for no of days: {noOfDays} Days with no of People or group: {People} with Total Budget: {Budget} (where Budget is the total for the entire group); give me list of hotels with hotel name, description, address, rating, price, location in map, coordinates, image url; also for the same create the itinerary for {noOfDays} days, suggest places, give name, details, pricing, timings, place images urls, location (coordinate or in map); Remember all have to cover within the {Budget} total budget. Important: give the result in JSON Format"
*/


/*
export const SelectBudgetOptions = [
    {
        id: 1,
        icon: "💵",
        title: "Cheap",
        desc: "Economize and Save"
    },
    {
        id: 2,
        icon: "💰",
        title: "Moderate",
        desc: "Balance Cost and Comfort"
    },
    {
        id: 3,
        icon: "💎",
        title: "Luxury",
        desc: "Indulge without Limits"
    },
]

export const SelectNoOfPersons = [
    {
        id: 1,
        icon: "🚶",
        title: "Solo",
        desc: "Discovering on Your Own",
        no: "1 Person"
    },
    {
        id: 2,
        icon: "💑",
        title: "Partner",
        desc: "Exploring with a Loved One",
        no: "2 People"
    },
    {
        id: 3,
        icon: "👨‍👩‍👧‍👦",
        title: "Family",
        desc: "Fun for All Ages",
        no: "3 to 5 People"
    },
    {
        id: 4,
        icon: "🤝",
        title: "Friends",
        desc: "Adventure with Your Crew",
        no: "5 to 10 People"
    },
]

export const PROMPT = "Create an optimal trip itinerary based on the specified location, duration, budget, number of persons, and preferences. Generate Travel Plan for Location: {location} for no of days: {noOfDays} Days with no of People or group: {People} with Total Budget: {Budget} (where Budget is the total for the entire group) and Preferences: {preferences}; give me list of hotels with hotel name, description, address, rating, price, location in map, coordinates, image url; also for the same create the itinerary for {noOfDays} days, suggest places, give name, details, pricing, timings, place images urls, location (coordinate or in map); Remember all have to cover within the {Budget} total budget and align with the specified preferences: {preferences}. Important: give the result in JSON Format"

*/

export const SelectBudgetOptions = [
    {
        id: 1,
        icon: "💵",
        title: "Cheap",
        desc: "Economize and Save"
    },
    {
        id: 2,
        icon: "💰",
        title: "Moderate",
        desc: "Balance Cost and Comfort"
    },
    {
        id: 3,
        icon: "💎",
        title: "Luxury",
        desc: "Indulge without Limits"
    },
]

export const SelectNoOfPersons = [
    {
        id: 1,
        icon: "🚶",
        title: "Solo",
        desc: "Discovering on Your Own",
        no: "1 Person"
    },
    {
        id: 2,
        icon: "💑",
        title: "Partner",
        desc: "Exploring with a Loved One",
        no: "2 People"
    },
    {
        id: 3,
        icon: "👨‍👩‍👧‍👦",
        title: "Family",
        desc: "Fun for All Ages",
        no: "3 to 5 People"
    },
    {
        id: 4,
        icon: "🤝",
        title: "Friends",
        desc: "Adventure with Your Crew",
        no: "5 to 10 People"
    },
]

export const PROMPT = "Create an optimal trip itinerary based on the specified location, duration, budget, number of persons, preferences, and pace. Generate Travel Plan for Location: {location} for no of days: {noOfDays} Days with no of People or group: {People} with Total Budget: {Budget} (where Budget is the total for the entire group), Preferences: {preferences}, and Pace: {pace} (Relaxed: 1-2 activities/day, Moderate: 3-4 activities/day, Packed: 5-6 activities/day); give me a list of hotels with hotel name, description, address, rating, price, location in map, coordinates (latitude, longitude), image url; also create the itinerary for {noOfDays} days, suggest places, give name, details, pricing, timings, place image urls, location coordinates (latitude, longitude); ensure activities are scheduled to minimize travel time between locations; all must fit within the {Budget} total budget and align with the specified preferences: {preferences} and pace: {pace}. Important: give the result in JSON Format"