import {Flex} from "antd";

export default function FilmStrip({ children }) {


    return (
        <Flex gap="middle" vertical>
            <Flex>
                {children}
            </Flex>
        </Flex>
    )
}