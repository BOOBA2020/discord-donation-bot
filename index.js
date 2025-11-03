const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const path = require('path');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log('🌐 INCOMING REQUEST:');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('---');
    next();
});


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});



app.get('/', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Donation server is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

function getDonationEmoji(amount) {
    if (amount >= 10000000) return '<:startfall:1414154493259681923>';
    if (amount >= 1000000) return '<:smite:1414154476800966776>';
    if (amount >= 100000) return '<:nuike:1414154435457843200>';
    if (amount >= 10000) return '<:blimp:1400850994119577600>';
    if (amount >= 5000) return '<:sign:1434591601598140468>';
    return '<:sign:1434591601598140468>';
}

function formatCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getColor(robux) {
    if (robux >= 10000000) return '#FB0505';
    if (robux >= 1000000) return '#EF1085';
    if (robux >= 100000) return '#FA04F2';
    if (robux >= 10000) return '#01d9FF';
    if (robux >= 5000) return '#FF8801';
    return '#00FF00';
}

async function getRobloxThumbnail(userId) {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        if (response.data.data && response.data.data[0] && response.data.data[0].imageUrl) {
            return response.data.data[0].imageUrl;
        }
    } catch (error) {}
    return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
}

async function createDonationImage(donatorAvatar, raiserAvatar, donatorName, raiserName, amount) {
    const canvas = createCanvas(700, 200);
    const ctx = canvas.getContext('2d');
    
    const donationColor = getColor(amount);
    
    ctx.clearRect(0, 0, 700, 200);
    
    if (amount >= 1000000) {
        const gradient = ctx.createLinearGradient(0, 170, 0, 200);
        gradient.addColorStop(0, donationColor + '05');
        gradient.addColorStop(0.5, donationColor + '22');
        gradient.addColorStop(1, donationColor + '43');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 170, 700, 50);
    }
    if (amount >= 10000000) {
        const gradient = ctx.createLinearGradient(0, 50, 0, 200);
        gradient.addColorStop(0, donationColor + '10');
        gradient.addColorStop(0.3, donationColor + '40');
        gradient.addColorStop(1, donationColor + '80');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 50, 700, 150);
    }

    try {
        const donatorImg = await loadImage(donatorAvatar);
        const raiserImg = await loadImage(raiserAvatar);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(138, 100, 45, 0, Math.PI * 2);  
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(donatorImg, 93, 55, 90, 90);  
        ctx.restore();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(568, 100, 45, 0, Math.PI * 2);  
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(raiserImg, 523, 55, 90, 90);  
        ctx.restore();
        
        ctx.strokeStyle = donationColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(138, 100, 45, 0, Math.PI * 2);  
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(568, 100, 45, 0, Math.PI * 2);  
        ctx.stroke();
        
    } catch (error) {
        console.error('Error loading avatars:', error);
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;  
    ctx.globalCompositeOperation = 'source-over'; 

    ctx.strokeText(`@${donatorName}`, 138, 170);
    ctx.fillText(`@${donatorName}`, 138, 170);

    ctx.strokeText(`@${raiserName}`, 568, 170);
    ctx.fillText(`@${raiserName}`, 568, 170);
    
    ctx.fillStyle = donationColor;
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;

    try {
        const robuxImage = await loadImage('https://cdn.discordapp.com/emojis/1381864904767832104.png');
        
        const text = `${formatCommas(amount)}`;
        const textWidth = ctx.measureText(text).width;
        
        const imageSize = 60;
        const xPos = 365 - (textWidth / 2) - imageSize - 1;
        const yPos = 55;

        const tempCanvas = createCanvas(imageSize, imageSize);
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(robuxImage, 0, 0, imageSize, imageSize);
        
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = donationColor;
        tempCtx.fillRect(0, 0, imageSize, imageSize);

        ctx.drawImage(tempCanvas, xPos, yPos);
        
        ctx.strokeText(text, 365, 100);
        ctx.fillText(text, 365, 100);
        
    } catch (error) {
        ctx.strokeText(`⏣ ${formatCommas(amount)}`, 350, 100);
        ctx.fillText(`⏣ ${formatCommas(amount)}`, 350, 100);
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText('donated to', 350, 140);
    ctx.fillText('donated to', 350, 140);

    return canvas.toBuffer();
}

app.post('/donation', async (req, res) => {
    console.log('📥 FULL REQUEST RECEIVED:');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Body type:', typeof req.body);
    
    // Check if body exists
    if (!req.body) {
        console.log('❌ No body received');
        return res.status(400).json({ success: false, error: 'No body received' });
    }
    
    const { DonatorId, RaiserId, DonatorName, RaiserName, Amount } = req.body;
    
    console.log('📋 Parsed fields:');
    console.log('- DonatorId:', DonatorId, typeof DonatorId);
    console.log('- RaiserId:', RaiserId, typeof RaiserId); 
    console.log('- DonatorName:', DonatorName, typeof DonatorName);
    console.log('- RaiserName:', RaiserName, typeof RaiserName);
    console.log('- Amount:', Amount, typeof Amount);
    
    // Check each field individually
    const missingFields = [];
    if (!DonatorId) missingFields.push('DonatorId');
    if (!RaiserId) missingFields.push('RaiserId');
    if (!DonatorName) missingFields.push('DonatorName');
    if (!RaiserName) missingFields.push('RaiserName');
    if (!Amount) missingFields.push('Amount');
    
    if (missingFields.length > 0) {
        console.log('❌ Missing fields:', missingFields);
        return res.status(400).json({ 
            success: false, 
            error: 'Missing fields: ' + missingFields.join(', ') 
        });
    }
    
    console.log('✅ All fields present, processing donation...');
    
    try {
        const donatorAvatar = await getRobloxThumbnail(DonatorId);
        const raiserAvatar = await getRobloxThumbnail(RaiserId);
        const donationColor = getColor(Amount);
        
        const imageBuffer = await createDonationImage(
            donatorAvatar, 
            raiserAvatar, 
            DonatorName, 
            RaiserName, 
            Amount
        );

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'donation.png' });

        const channel = await client.channels.fetch('1420042400968999025');
        await channel.send({
            content: `${getDonationEmoji(Amount)} \`@${DonatorName}\` donated **<:smallrobux:1434592131271626772>${formatCommas(Amount)} Robux** to \`@${RaiserName}\``,
            embeds: [{
                color: parseInt(donationColor.replace('#', ''), 16),
                image: {
                    url: "attachment://donation.png"
                },
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Donated on"
                }
            }],
            files: [attachment]
        });
        
        console.log('✅ Donation processed successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error processing donation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server running on port ${PORT}`);
});

client.login(process.env.TOKEN);
