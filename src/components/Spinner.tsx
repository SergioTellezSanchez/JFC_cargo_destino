export default function Spinner({ size = 'md', color = 'white' }: { size?: 'sm' | 'md' | 'lg', color?: string }) {
    const sizeMap = {
        sm: '16px',
        md: '24px',
        lg: '32px'
    };

    const borderWidth = {
        sm: '2px',
        md: '3px',
        lg: '4px'
    };

    return (
        <div
            className="spinner"
            style={{
                display: 'inline-block',
                width: sizeMap[size],
                height: sizeMap[size],
                border: `${borderWidth[size]} solid ${color === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}`,
                borderTop: `${borderWidth[size]} solid ${color}`,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }}
        />
    );
}
