# Routine System Updates

## Vocabulary Changes
- **Routine Steps** → **Daily Reminders** (activities performed every day)
- **Additional Steps** → **Additional Recommendations** (one-time, weekly, or as-needed actions)

## New Features Implemented

### 1. Daily Reminders Section
- Clear heading "Daily Reminders" with subtitle
- Shows reminder time for each step (e.g., 07:00 AM)
- Improved video link visibility with pill-style button
- Pro tips are collapsible (hidden by default)
- Duration shown for each step

### 2. Additional Recommendations Section
- Separate section below daily reminders
- Frequency badges:
  - 🔵 One-time (blue)
  - 🟣 Weekly (purple)
  - 🟡 Monthly (amber)
  - ⚪ As needed (gray)
- Check-off functionality independent of daily steps
- Tips shown inline for additional steps

### 3. UI Improvements
- Better visual hierarchy
- Video links are now more prominent with background color
- Pro tips use lightbulb icon and expand/collapse smoothly
- Package icon for additional recommendations section
- Bell icon shows reminder times

## Example Structure

### Allergy Management Routine

**Daily Reminders:**
1. Morning Nasal Rinse - 5 min @ 07:00
   - Pro Tips: Use distilled water, lean forward slightly
2. Take Antihistamine - 2 min @ 08:00
   - Pro Tips: Take with food to avoid stomach upset
3. Evening Shower - 10 min @ 21:00
   - Pro Tips: Wash hair to remove pollen

**Additional Recommendations:**
- Install HEPA Air Filter (One-time)
- Wash Bedding in Hot Water (Weekly)
- Replace Air Filter (Monthly)
- Deep Clean Bedroom (As needed)

## OpenAI Prompt Updates
Created `routineStructure.md` to guide the assistant on:
- Separating daily habits from setup/maintenance tasks
- Including reminder times for each daily step
- Adding pro tips for detailed guidance
- Categorizing additional recommendations by frequency

## Benefits
1. **Clearer user expectations** - Daily vs occasional tasks
2. **Better habit formation** - Focus on daily reminders
3. **Comprehensive coverage** - Includes setup and maintenance
4. **Improved usability** - Pro tips don't clutter the interface
5. **Flexible scheduling** - Reminder times for each step