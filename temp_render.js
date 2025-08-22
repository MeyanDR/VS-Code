function renderBreak2Layout(ctx, canvas, section, instruments) {
    console.log('🎯 RENDERING EXACT A4 Break 2.jpeg LAYOUT');
    
    // A4 DIMENSIONS - 794x1123 pixels (at 96 DPI)
    canvas.width = 794;
    canvas.height = 1123;
    
    // A4 margins and positioning
    const margin = 40;
    const headerHeight = 80;
    const instrumentNameWidth = 90;
    const cellHeight = 24; // Shorter rectangles like in image  
    const rowHeight = 30;
    
    // WHITE BACKGROUND
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // HEADER - EXACT text from Break 2.jpeg
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(section.name || 'SONG 3', canvas.width / 2, margin + 25);
    
    // SECTION NAME - LEFT ALIGNED
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Section: ${section.name || 'Start Groove 2'}`, margin, margin + 50);
    
    // PATTERN TYPE - LEFT ALIGNED (just "loop" or "break")
    ctx.font = '12px Arial';
    const patternType = section.type === 'break' ? 'break' : 'loop';
    ctx.fillText(`Pattern Type: ${patternType}`, margin, margin + 70);
    
    // CALCULATE GRID DIMENSIONS for A4 with 2 bars per line
    const availableWidth = canvas.width - (2 * margin) - instrumentNameWidth; // ~624px
    const bars = section.bars || 4;
    const beats = section.beats || 4;
    const subdivision = section.subdivision || 4;
    
    const barsPerLine = 2;
    const totalSubdivisionsPerLine = barsPerLine * beats * subdivision; // 32 subdivisions
    const calculatedCellWidth = Math.floor(availableWidth / totalSubdivisionsPerLine); // ~19px per cell
    
    const gridStartY = margin + headerHeight;
    const gridStartX = margin + instrumentNameWidth;
    const totalLines = Math.ceil(bars / barsPerLine);
    
    // RENDER EACH LINE (2 bars per line)
    for (let line = 0; line < totalLines; line++) {
        const startBar = line * barsPerLine;
        const endBar = Math.min(startBar + barsPerLine, bars);
        const currentY = gridStartY + (line * (instruments.length * rowHeight + 80));
        
        // RENDER LABELS AND GRID STRUCTURE
        let currentX = gridStartX;
        
        for (let barIndex = 0; barIndex < barsPerLine && (startBar + barIndex) < bars; barIndex++) {
            const barNumber = startBar + barIndex + 1;
            
            // BAR LABEL "Bar 1", "Bar 2", etc. - above first subdivision of first beat
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Bar ${barNumber}`, currentX, currentY - 25);
            
            // RENDER BEATS IN THIS BAR
            for (let beat = 0; beat < beats; beat++) {
                const beatStartX = currentX + (beat * subdivision * calculatedCellWidth);
                
                // BEAT LABEL "X.Y" - above first subdivision of each beat
                ctx.fillStyle = '#000000';
                ctx.font = '10px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`${barNumber}.${beat + 1}`, beatStartX, currentY - 10);
                
                // SUBDIVISION MARKER (5), (6) etc. - centered above entire beat if subdivision ≠ 4
                if (subdivision !== 4) {
                    ctx.fillStyle = '#666666';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    const beatCenterX = beatStartX + (subdivision * calculatedCellWidth / 2);
                    ctx.fillText(`(${subdivision})`, beatCenterX, currentY - 35);
                }
                
                // VERTICAL BEAT SEPARATOR LINE (thin) - between beats
                if (beat > 0) {
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(beatStartX, currentY - 5);
                    ctx.lineTo(beatStartX, currentY + (instruments.length * rowHeight));
                    ctx.stroke();
                }
            }
            
            // Update X position for next bar
            currentX += beats * subdivision * calculatedCellWidth;
            
            // BOLD BAR LINE at end of bar
            if (barIndex < barsPerLine - 1 && (startBar + barIndex + 1) < bars) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3; // BOLD line
                ctx.beginPath();
                ctx.moveTo(currentX, currentY - 5);
                ctx.lineTo(currentX, currentY + (instruments.length * rowHeight));
                ctx.stroke();
                ctx.lineWidth = 1; // Reset line width
            }
        }
        
        // RENDER INSTRUMENT ROWS
        instruments.forEach((instrument, instIndex) => {
            const rowY = currentY + (instIndex * rowHeight);
            
            // GRAY INSTRUMENT NAME COLUMN
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(margin, rowY, instrumentNameWidth, cellHeight);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(margin, rowY, instrumentNameWidth, cellHeight);
            
            // INSTRUMENT NAME
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(instrument.name, margin + instrumentNameWidth/2, rowY + cellHeight/2 + 4);
            
            // RENDER SUBDIVISION CELLS
            let cellX = gridStartX;
            
            for (let barIndex = 0; barIndex < barsPerLine && (startBar + barIndex) < bars; barIndex++) {
                const barNumber = startBar + barIndex;
                
                for (let beat = 0; beat < beats; beat++) {
                    for (let sub = 0; sub < subdivision; sub++) {
                        const stepIndex = (barNumber * beats * subdivision) + (beat * subdivision) + sub;
                        
                        // Get pattern value
                        const patternValue = stepIndex < instrument.pattern.length ? instrument.pattern[stepIndex] : '';
                        const hasValue = patternValue && patternValue.trim() !== '';
                        
                        // CELL BACKGROUND - GRAY only for FIRST subdivision of each beat (sub === 0)
                        if (sub === 0) {
                            ctx.fillStyle = '#E0E0E0'; // Gray background for first subdivision
                        } else {
                            ctx.fillStyle = '#FFFFFF'; // White background for other subdivisions
                        }
                        ctx.fillRect(cellX, rowY, calculatedCellWidth, cellHeight);
                        
                        // CELL BORDER
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(cellX, rowY, calculatedCellWidth, cellHeight);
                        
                        // PATTERN SYMBOL
                        if (hasValue) {
                            ctx.fillStyle = '#000000';
                            ctx.font = 'bold 14px Arial';
                            ctx.textAlign = 'center';
                            
                            const symbol = instrument.name.toLowerCase().includes('shaker') ? 'x' : 'o';
                            ctx.fillText(symbol, cellX + calculatedCellWidth/2, rowY + cellHeight/2 + 5);
                        }
                        
                        cellX += calculatedCellWidth;
                    }
                }
            }
        });
    }
    
    // LEGEND at bottom - EXACT from Break 2.jpeg
    const legendY = gridStartY + (totalLines * (instruments.length * rowHeight + 80)) + 40;
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText('Legend:', margin, legendY);
    ctx.fillText('o = Bass Drum', margin, legendY + 15);
    ctx.fillText('1,2,3 = Variations', margin, legendY + 30);
    
    ctx.fillText('x = Hi-hats', margin + 150, legendY + 15);
    ctx.fillText('1..3 = Mandatory Played', margin + 150, legendY + 30);
    
    ctx.fillText('/ = Skip', margin + 300, legendY + 15);
    ctx.fillText('< = Accent', margin + 300, legendY + 30);
    
    console.log('✅ Break 2.jpeg layout rendered EXACTLY!');
}