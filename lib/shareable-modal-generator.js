// lib/shareable-modal-generator.js - Convert Bragging Rights Modal to PNG

// Generate shareable PNG from bragging rights data
export const generateShareableModal = async (braggingData, currentTheme, studentData) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎨 Generating shareable modal for:', braggingData.studentName);
      
      // Create high-resolution canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scale = 2;
      canvas.width = 400 * scale;
      canvas.height = 600 * scale;
      ctx.scale(scale, scale);
      
      // Set font loading promises
      const didotFont = new FontFace('Didot', 'local("Didot"), local("Didot Regular")');
      const avenirFont = new FontFace('Avenir', 'local("Avenir"), local("Avenir Regular")');
      
      Promise.all([
        didotFont.load().catch(() => console.log('Didot font not available')),
        avenirFont.load().catch(() => console.log('Avenir font not available'))
      ]).then(() => {
        try {
          document.fonts.add(didotFont);
          document.fonts.add(avenirFont);
        } catch (e) {
          console.log('Using fallback fonts');
        }
        
        // Create elegant background gradient
        const backgroundGradient = ctx.createLinearGradient(0, 0, 400, 600);
        backgroundGradient.addColorStop(0, '#FFFCF5'); // Soft cream
        backgroundGradient.addColorStop(0.3, currentTheme.primary + '20');
        backgroundGradient.addColorStop(0.7, currentTheme.secondary + '30');
        backgroundGradient.addColorStop(1, '#FFFCF5');
        
        ctx.fillStyle = backgroundGradient;
        ctx.fillRect(0, 0, 400, 600);
        
        // Elegant border frame
        ctx.strokeStyle = '#223848'; // Deep teal
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, 370, 570);
        
        // Load and draw logo
        const img = new Image();
        img.onload = () => {
          try {
            // Header with logo and academic year
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(30, 30, 340, 80);
            ctx.strokeStyle = currentTheme.primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, 340, 80);
            
            // Draw logo (left side)
            ctx.drawImage(img, 40, 40, 60, 60);
            
            // Title text
            ctx.fillStyle = '#223848';
            ctx.font = 'bold 20px Didot, serif';
            ctx.textAlign = 'center';
            ctx.fillText('LUX LIBRIS', 270, 60);
            
            // Academic year
            const academicYear = studentData.academicYear || '2025-26';
            const formattedYear = academicYear.includes('-') ? 
              academicYear.replace('-', '-20') : academicYear;
            
            ctx.font = '12px Didot, serif';
            ctx.fillStyle = '#C3E0DE';
            ctx.fillText(`AWARD ${formattedYear}`, 270, 75);
            
            ctx.font = '14px Avenir, sans-serif';
            ctx.fillStyle = '#223848';
            ctx.fillText('READING ACHIEVEMENTS', 270, 90);
            
            // Student information
            ctx.font = 'bold 24px Didot, serif';
            ctx.textAlign = 'center';
            ctx.fillText(braggingData.studentName, 200, 140);
            
            ctx.font = '16px Avenir, sans-serif';
            ctx.fillStyle = '#C3E0DE';
            ctx.fillText(`Grade ${braggingData.grade} • ${braggingData.schoolName}`, 200, 160);
            ctx.fillText(`Generated: ${braggingData.date}`, 200, 180);
            
            // Stats boxes
            const statsY = 200;
            const boxWidth = 70;
            const boxHeight = 60;
            const spacing = 10;
            const startX = (400 - (boxWidth * 4 + spacing * 3)) / 2;
            
            const stats = [
              { label: 'Level', value: braggingData.level || 1, color: currentTheme.primary },
              { label: 'XP', value: braggingData.totalXP || 0, color: '#C3E0DE' },
              { label: 'Badges', value: braggingData.badgesEarned || 0, color: '#A1E5DB' },
              { label: 'Books', value: braggingData.booksThisYear || 0, color: '#D4AF37' }
            ];
            
            stats.forEach((stat, index) => {
              const x = startX + index * (boxWidth + spacing);
              
              // Stat box
              ctx.fillStyle = stat.color + '30';
              ctx.fillRect(x, statsY, boxWidth, boxHeight);
              ctx.strokeStyle = stat.color;
              ctx.lineWidth = 2;
              ctx.strokeRect(x, statsY, boxWidth, boxHeight);
              
              // Value
              ctx.fillStyle = '#223848';
              ctx.font = 'bold 18px Avenir, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(stat.value.toString(), x + boxWidth/2, statsY + 30);
              
              // Label
              ctx.font = '10px Avenir, sans-serif';
              ctx.fillStyle = '#556B7A';
              ctx.fillText(stat.label, x + boxWidth/2, statsY + 50);
            });
            
            // Featured badge (if available)
            if (braggingData.featuredBadge) {
              const badgeY = 280;
              
              ctx.fillStyle = '#D4AF37' + '30';
              ctx.fillRect(80, badgeY, 240, 60);
              ctx.strokeStyle = '#D4AF37';
              ctx.lineWidth = 2;
              ctx.strokeRect(80, badgeY, 240, 60);
              
              ctx.font = '24px Avenir, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(braggingData.featuredBadge.emoji, 130, badgeY + 35);
              
              ctx.fillStyle = '#223848';
              ctx.font = 'bold 14px Avenir, sans-serif';
              ctx.fillText('Latest Badge', 230, badgeY + 25);
              
              ctx.font = '12px Avenir, sans-serif';
              ctx.fillText(braggingData.featuredBadge.name, 230, badgeY + 40);
            }
            
            // Achievements section
            ctx.fillStyle = '#223848';
            ctx.font = 'bold 16px Didot, serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌟 TOP ACHIEVEMENTS 🌟', 200, 370);
            
            // Achievement list
            const achievements = braggingData.topAchievements?.slice(0, 4) || [];
            achievements.forEach((achievement, index) => {
              const y = 390 + index * 25;
              
              // Achievement background
              ctx.fillStyle = '#FFFFFF' + 'F0';
              ctx.fillRect(40, y - 10, 320, 20);
              ctx.strokeStyle = currentTheme.primary + '60';
              ctx.lineWidth = 1;
              ctx.strokeRect(40, y - 10, 320, 20);
              
              // Achievement text
              ctx.fillStyle = '#223848';
              ctx.font = '11px Avenir, sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(`• ${achievement}`, 50, y + 2);
            });
            
            // Footer
            ctx.fillStyle = '#C3E0DE';
            ctx.font = '10px Avenir, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 Keep reading and unlocking more achievements!', 200, 530);
            ctx.fillText('Lux Libris - Where Reading Lights the Way', 200, 545);
            ctx.fillText('Visit luxlibris.org to learn more', 200, 560);
            
            // Convert to blob and resolve
            canvas.toBlob((blob) => {
              console.log('✅ Shareable modal generated successfully');
              resolve(blob);
            }, 'image/png', 1.0);
            
          } catch (error) {
            console.error('❌ Error drawing shareable modal:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          console.error('❌ Error loading Lux Libris logo');
          reject(new Error('Failed to load lux_libris_logo.png'));
        };
        
        // Load the Lux Libris logo
        img.src = '/images/lux_libris_logo.png';
        
      }).catch(error => {
        console.error('❌ Error loading fonts:', error);
        reject(error);
      });
      
    } catch (error) {
      console.error('❌ Error creating shareable modal:', error);
      reject(error);
    }
  });
};

// Download the shareable modal
export const downloadShareableModal = async (braggingData, currentTheme, studentData) => {
  try {
    console.log('📥 Downloading shareable modal...');
    const blob = await generateShareableModal(braggingData, currentTheme, studentData);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${braggingData.studentName.replace(' ', '_')}_Lux_Libris_Achievement_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('❌ Error downloading shareable modal:', error);
    return false;
  }
};

// Share the modal
export const shareModal = async (braggingData, currentTheme, studentData) => {
  try {
    console.log('📤 Sharing modal...');
    const blob = await generateShareableModal(braggingData, currentTheme, studentData);
    
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `${braggingData.studentName}_Lux_Libris_Achievement.png`, { type: 'image/png' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Lux Libris Reading Achievements',
          text: `Check out my reading achievements from Lux Libris! 📚✨`,
          files: [file]
        });
        return true;
      }
    }
    
    // Fallback to download
    return await downloadShareableModal(braggingData, currentTheme, studentData);
    
  } catch (error) {
    console.error('❌ Error sharing modal:', error);
    return false;
  }
};