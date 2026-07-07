import React from 'react';
import { Group, Circle, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

interface AvatarImageProps {
    url: string;
    fallbackUrl?: string;
    x: number;
    y: number;
    size: number;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ url, fallbackUrl, x, y, size }) => {
    const [image, status] = useImage(url);
    const [fallbackImage] = useImage(fallbackUrl || '');

    const displayImage = (status === 'loaded' && image) ? image : fallbackImage;

    return (
        <Group x={x} y={y}>
            <Circle radius={size / 2} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1} />
            {displayImage && (
                <Group clipFunc={(ctx) => ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false)}>
                    <KonvaImage
                        image={displayImage}
                        width={size}
                        height={size}
                        x={-size / 2}
                        y={-size / 2}
                    />
                </Group>
            )}
        </Group>
    );
};
export default AvatarImage;
