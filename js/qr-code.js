document.addEventListener("DOMContentLoaded", () => {
    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer || typeof QRCodeStyling === 'undefined') return;

    const qrCode = new QRCodeStyling({
        width: 100, // MUST keep it at 100
        height: 100, // MUST keep it at 100
        type: 'svg',
        shape: 'circle',
        data: "https://vincent.strsx.com/",
        dotsOptions: {
            color: "#4a90e2",
            type: 'rounded'
        },
        backgroundOptions: {
            color: "transparent",
        },
        cornersSquareOptions: {
            type: 'extra-rounded'
        },
        cornersDotOptions: {
            type: 'dot'
        },
        qrOptions: {
            typeNumber: 0,
            mode: 'Byte',
            errorCorrectionLevel: 'Q'
        },
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.4,
            margin: 0
        }
    });

    qrCode.append(qrContainer);
});
